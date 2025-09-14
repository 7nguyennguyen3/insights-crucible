"""
Quiz planning service for intelligent section grouping and quiz distribution.
"""

from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
from rich import print

from ...interfaces import SectionAnalysis


@dataclass
class QuizGroup:
    """Represents a group of sections that will form one quiz."""
    
    sections: List[SectionAnalysis]
    quiz_number: int
    estimated_questions: int
    total_concepts: int
    section_indices: List[int]
    
    @property
    def section_range(self) -> str:
        """Human-readable section range for this quiz."""
        if len(self.section_indices) == 1:
            return f"Section {self.section_indices[0] + 1}"
        return f"Sections {self.section_indices[0] + 1}-{self.section_indices[-1] + 1}"
    
    @property
    def total_duration_minutes(self) -> float:
        """Calculate total duration of all sections in this group."""
        total_seconds = 0
        for section in self.sections:
            try:
                start_parts = section.start_time.split(":")
                end_parts = section.end_time.split(":")
                
                if len(start_parts) == 2:  # MM:SS format
                    start_seconds = int(start_parts[0]) * 60 + int(start_parts[1])
                elif len(start_parts) == 3:  # HH:MM:SS format
                    start_seconds = int(start_parts[0]) * 3600 + int(start_parts[1]) * 60 + int(start_parts[2])
                else:
                    continue
                    
                if len(end_parts) == 2:  # MM:SS format
                    end_seconds = int(end_parts[0]) * 60 + int(end_parts[1])
                elif len(end_parts) == 3:  # HH:MM:SS format  
                    end_seconds = int(end_parts[0]) * 3600 + int(end_parts[1]) * 60 + int(end_parts[2])
                else:
                    continue
                    
                section_duration = max(0, end_seconds - start_seconds)
                total_seconds += section_duration
                
            except (ValueError, IndexError):
                continue
        
        return total_seconds / 60.0


class QuizPlanner:
    """Plans quiz distribution based on section analysis and content density."""
    
    # Configuration constants
    MIN_QUESTIONS_PER_QUIZ = 5
    IDEAL_QUESTIONS_PER_QUIZ = 7
    MAX_QUESTIONS_PER_QUIZ = 10
    MIN_CONCEPTS_FOR_QUESTION = 1  # Minimum concepts needed to generate 1 good question
    MAX_QUIZZES = 3
    
    def __init__(self):
        pass
    
    def plan_quiz_distribution(self, section_analyses: List[SectionAnalysis]) -> List[QuizGroup]:
        """
        Analyze sections and create optimal quiz groupings.
        
        Args:
            section_analyses: List of analyzed sections
            
        Returns:
            List of QuizGroup objects representing the planned quiz distribution
        """
        if not section_analyses:
            return []
        
        print(f"[cyan]Planning quiz distribution for {len(section_analyses)} sections...[/cyan]")
        
        # Step 1: Analyze section content quality
        section_metrics = self._analyze_section_content(section_analyses)
        
        # Step 2: Determine optimal number of quizzes
        num_quizzes = self._determine_quiz_count(section_analyses, section_metrics)
        
        # Step 3: Group sections intelligently
        quiz_groups = self._create_quiz_groups(section_analyses, section_metrics, num_quizzes)
        
        # Step 4: Validate and adjust groups
        quiz_groups = self._validate_and_adjust_groups(quiz_groups)
        
        self._log_quiz_plan(quiz_groups)
        
        return quiz_groups
    
    def _analyze_section_content(self, sections: List[SectionAnalysis]) -> List[Dict[str, Any]]:
        """Analyze content quality and density for each section."""
        metrics = []
        
        for i, section in enumerate(sections):
            # Count lessons and concepts
            lessons = section.additional_data.get("lessons_and_concepts", [])
            concept_count = len(lessons) if isinstance(lessons, list) else 0
            
            # Count entities (important concepts/people mentioned)
            entity_count = len(section.entities)
            
            # Count quotes (supporting evidence)
            quote_count = len(section.quotes)
            
            # Calculate content richness score
            content_score = concept_count * 2 + entity_count + quote_count
            
            # Estimate potential questions from this section
            potential_questions = max(1, min(concept_count, 3))  # 1-3 questions per section
            
            metrics.append({
                "section_index": i,
                "concept_count": concept_count,
                "entity_count": entity_count,
                "quote_count": quote_count,
                "content_score": content_score,
                "potential_questions": potential_questions,
                "has_substantial_content": concept_count >= 2 and quote_count >= 1
            })
        
        return metrics
    
    def _determine_quiz_count(self, sections: List[SectionAnalysis], metrics: List[Dict]) -> int:
        """Determine optimal number of quizzes based on content analysis."""
        num_sections = len(sections)
        total_concepts = sum(m["concept_count"] for m in metrics)
        substantial_sections = sum(1 for m in metrics if m["has_substantial_content"])
        
        print(f"[blue]Content Analysis: {num_sections} sections, {total_concepts} total concepts, {substantial_sections} substantial sections[/blue]")
        
        # Decision logic based on content density and section count
        if num_sections <= 3 or substantial_sections <= 2:
            # Small content or few substantial sections: 1 quiz
            return 1
        elif num_sections <= 6 and substantial_sections >= 3:
            # Medium content with good substance: 2 quizzes
            return 2
        elif num_sections >= 7 and substantial_sections >= 4:
            # Large content with good substance: 3 quizzes
            return min(3, max(2, substantial_sections // 3))
        else:
            # Default to 2 quizzes for edge cases
            return 2
    
    def _create_quiz_groups(self, sections: List[SectionAnalysis], metrics: List[Dict], num_quizzes: int) -> List[QuizGroup]:
        """Create quiz groups by intelligently distributing sections."""
        if num_quizzes == 1:
            return self._create_single_quiz_group(sections, metrics)
        
        # Calculate section distribution
        sections_per_quiz = len(sections) // num_quizzes
        remainder = len(sections) % num_quizzes
        
        groups = []
        start_idx = 0
        
        for quiz_num in range(num_quizzes):
            # Adjust group size to distribute remainder
            group_size = sections_per_quiz + (1 if quiz_num < remainder else 0)
            end_idx = start_idx + group_size
            
            section_group = sections[start_idx:end_idx]
            group_metrics = metrics[start_idx:end_idx]
            
            # Calculate group statistics
            total_concepts = sum(m["concept_count"] for m in group_metrics)
            estimated_questions = min(
                self.MAX_QUESTIONS_PER_QUIZ,
                max(self.MIN_QUESTIONS_PER_QUIZ, sum(m["potential_questions"] for m in group_metrics))
            )
            
            quiz_group = QuizGroup(
                sections=section_group,
                quiz_number=quiz_num + 1,
                estimated_questions=estimated_questions,
                total_concepts=total_concepts,
                section_indices=list(range(start_idx, end_idx))
            )
            
            groups.append(quiz_group)
            start_idx = end_idx
        
        return groups
    
    def _create_single_quiz_group(self, sections: List[SectionAnalysis], metrics: List[Dict]) -> List[QuizGroup]:
        """Create a single quiz group containing all sections."""
        total_concepts = sum(m["concept_count"] for m in metrics)
        estimated_questions = min(
            self.MAX_QUESTIONS_PER_QUIZ,
            max(self.MIN_QUESTIONS_PER_QUIZ, sum(m["potential_questions"] for m in metrics))
        )
        
        quiz_group = QuizGroup(
            sections=sections,
            quiz_number=1,
            estimated_questions=estimated_questions,
            total_concepts=total_concepts,
            section_indices=list(range(len(sections)))
        )
        
        return [quiz_group]
    
    def _validate_and_adjust_groups(self, groups: List[QuizGroup]) -> List[QuizGroup]:
        """Validate quiz groups and merge if necessary to meet minimum requirements."""
        if not groups:
            return groups
        
        # Check if any group has insufficient content
        adjusted_groups = []
        i = 0
        
        while i < len(groups):
            current_group = groups[i]
            
            # If group has very few concepts and isn't the last group, consider merging
            if (current_group.total_concepts < 3 and 
                current_group.estimated_questions < self.MIN_QUESTIONS_PER_QUIZ and 
                i < len(groups) - 1):
                
                print(f"[yellow]Quiz {current_group.quiz_number} has insufficient content ({current_group.total_concepts} concepts). Merging with next group...[/yellow]")
                
                # Merge with next group
                next_group = groups[i + 1]
                merged_sections = current_group.sections + next_group.sections
                merged_indices = current_group.section_indices + next_group.section_indices
                merged_concepts = current_group.total_concepts + next_group.total_concepts
                merged_questions = min(
                    self.MAX_QUESTIONS_PER_QUIZ,
                    current_group.estimated_questions + next_group.estimated_questions
                )
                
                merged_group = QuizGroup(
                    sections=merged_sections,
                    quiz_number=current_group.quiz_number,
                    estimated_questions=merged_questions,
                    total_concepts=merged_concepts,
                    section_indices=merged_indices
                )
                
                adjusted_groups.append(merged_group)
                i += 2  # Skip the next group since we merged it
            else:
                adjusted_groups.append(current_group)
                i += 1
        
        # Renumber quiz groups after potential merging
        for i, group in enumerate(adjusted_groups):
            group.quiz_number = i + 1
        
        return adjusted_groups
    
    def _log_quiz_plan(self, groups: List[QuizGroup]):
        """Log the planned quiz distribution for debugging."""
        print(f"[green]Quiz Distribution Plan: {len(groups)} quizzes[/green]")
        
        for group in groups:
            print(f"  Quiz {group.quiz_number}: {group.section_range}")
            print(f"    - Concepts: {group.total_concepts}")
            print(f"    - Est. Questions: {group.estimated_questions}")
            print(f"    - Duration: {group.total_duration_minutes:.1f}m")