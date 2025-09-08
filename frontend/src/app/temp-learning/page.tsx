'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Eye, EyeOff, Clock, User, Calendar } from 'lucide-react';

interface EntityExplanation {
  name: string;
  explanation: string;
}

interface SectionResult {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  summary: string;
  quotes: string[];
  entities: EntityExplanation[];
  verifiable_claims: string[];
  contextual_briefing?: any;
  additional_data?: any;
}

interface JobData {
  job_title: string;
  status: string;
  progress?: string;
  createdAt: string | null;
  updatedAt: string | null;
  request_data?: any;
  learning_synthesis?: any;
  generated_quiz_questions?: any;
  synthesis_results?: any;
}

interface ApiResponse {
  jobId: string;
  jobData: JobData;
  sectionResults: SectionResult[];
  totalSections: number;
  persona: string;
}

export default function TempLearningPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/temp-learning-data');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-lg">Loading learning accelerator data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Learning Accelerator Data Viewer</h1>
        <Badge variant="secondary" className="text-sm">
          Temporary Debug Page
        </Badge>
      </div>

      {/* Job Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Job Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-1">Job Title</h3>
              <p className="font-medium">{data.jobData.job_title}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-1">Status</h3>
              <Badge variant={data.jobData.status === 'COMPLETED' ? 'default' : 'secondary'}>
                {data.jobData.status}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-1">Persona</h3>
              <Badge variant="outline">{data.persona}</Badge>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-1">Total Sections</h3>
              <p className="font-medium">{data.totalSections}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <p className="text-sm font-medium">{formatTimestamp(data.jobData.createdAt || '')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm text-gray-600">Updated:</span>
                <p className="text-sm font-medium">{formatTimestamp(data.jobData.updatedAt || '')}</p>
              </div>
            </div>
          </div>

          {data.jobData.progress && (
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-1">Progress</h3>
              <p className="text-sm">{data.jobData.progress}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Synthesis Results */}
      {data.jobData.learning_synthesis && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Synthesis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.jobData.learning_synthesis.overall_learning_theme && (
                <div>
                  <h4 className="font-semibold mb-2">Overall Learning Theme</h4>
                  <p className="text-sm bg-blue-50 p-3 rounded-md">
                    {data.jobData.learning_synthesis.overall_learning_theme}
                  </p>
                </div>
              )}

              {data.jobData.learning_synthesis.consolidated_lessons && (
                <div>
                  <h4 className="font-semibold mb-2">
                    Consolidated Lessons ({data.jobData.learning_synthesis.consolidated_lessons.length})
                  </h4>
                  <div className="space-y-2">
                    {data.jobData.learning_synthesis.consolidated_lessons.map((lesson: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-green-500 pl-4 py-2">
                        <p className="text-sm font-medium">{lesson.lesson}</p>
                        {lesson.supporting_sections && (
                          <p className="text-xs text-gray-600 mt-1">
                            Sections: {lesson.supporting_sections.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.jobData.learning_synthesis.concept_connections && (
                <div>
                  <h4 className="font-semibold mb-2">
                    Concept Connections ({data.jobData.learning_synthesis.concept_connections.length})
                  </h4>
                  <div className="space-y-2">
                    {data.jobData.learning_synthesis.concept_connections.map((conn: any, idx: number) => (
                      <div key={idx} className="bg-purple-50 p-3 rounded-md text-sm">
                        <span className="font-medium">{conn.concept_1}</span>
                        <span className="mx-2 text-purple-600">→ {conn.relationship} →</span>
                        <span className="font-medium">{conn.concept_2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.jobData.learning_synthesis.practical_insights && (
                <div>
                  <h4 className="font-semibold mb-2">
                    Practical Insights ({data.jobData.learning_synthesis.practical_insights.length})
                  </h4>
                  <ul className="space-y-1">
                    {data.jobData.learning_synthesis.practical_insights.map((insight: any, idx: number) => (
                      <li key={idx} className="text-sm bg-yellow-50 p-2 rounded-md">
                        💡 {typeof insight === 'string' ? insight : JSON.stringify(insight)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Quiz Questions */}
      {data.jobData.generated_quiz_questions?.questions && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Quiz Questions</CardTitle>
            {data.jobData.generated_quiz_questions.quiz_metadata && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>Total Questions: {data.jobData.generated_quiz_questions.quiz_metadata.total_questions}</p>
                <p>Estimated Time: {data.jobData.generated_quiz_questions.quiz_metadata.estimated_time_minutes} minutes</p>
                <p>Quiz Type: {data.jobData.generated_quiz_questions.quiz_metadata.quiz_type}</p>
                <p>Source: {data.jobData.generated_quiz_questions.quiz_metadata.source}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.jobData.generated_quiz_questions.questions.map((question: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3">Question {idx + 1}</h4>
                  <p className="text-sm mb-3 font-medium">{question.question}</p>
                  
                  {question.options && (
                    <div className="space-y-2 mb-3">
                      <h5 className="text-xs font-semibold text-gray-600 uppercase">Options:</h5>
                      {Object.entries(question.options).map(([key, value]: [string, any]) => (
                        <div key={key} className={`text-sm p-2 rounded ${key === question.correct_answer ? 'bg-green-100 border-l-4 border-green-500' : 'bg-white'}`}>
                          <span className="font-medium">{key}.</span> {value}
                          {key === question.correct_answer && <span className="text-green-600 ml-2">✓ Correct</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="mb-3">
                      <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">Explanation:</h5>
                      <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{question.explanation}</p>
                    </div>
                  )}
                  
                  {question.supporting_quote && (
                    <div className="mb-3">
                      <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">Supporting Quote:</h5>
                      <blockquote className="text-sm italic border-l-4 border-gray-300 pl-3">
                        "{question.supporting_quote}"
                      </blockquote>
                    </div>
                  )}
                  
                  {question.related_timestamp && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Timestamp:</span> {question.related_timestamp}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Results */}
      <Card>
        <CardHeader>
          <CardTitle>Section Analysis Results ({data.totalSections} sections)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.sectionResults.map((section, idx) => (
              <Card key={section.id} className="border-l-4 border-blue-500">
                <Collapsible>
                  <CollapsibleTrigger 
                    className="w-full"
                    onClick={() => toggleSection(section.id)}
                  >
                    <CardHeader className="hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <CardTitle className="text-lg">
                            Section {idx + 1}: {section.title || `Section ${idx + 1}`}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {section.start_time} → {section.end_time}
                          </p>
                        </div>
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {section.summary && (
                          <div>
                            <h4 className="font-semibold mb-2">Summary</h4>
                            <p className="text-sm bg-blue-50 p-3 rounded-md">
                              {section.summary}
                            </p>
                          </div>
                        )}


                        {section.quotes && section.quotes.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Notable Quotes ({section.quotes.length})</h4>
                            <div className="space-y-3">
                              {section.quotes.map((quote: string, qIdx: number) => (
                                <div key={qIdx} className="border-l-4 border-gray-300 pl-4 bg-gray-50 p-3 rounded">
                                  <blockquote className="italic text-sm">
                                    "{quote}"
                                  </blockquote>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.entities && section.entities.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Entities ({section.entities.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {section.entities.map((entity: any, eIdx: number) => (
                                <div key={eIdx} className="bg-green-50 p-3 rounded-md text-sm">
                                  <span className="font-medium text-green-800">{entity.name}</span>
                                  <p className="text-gray-700 mt-1 text-xs">{entity.explanation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.verifiable_claims && section.verifiable_claims.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Verifiable Claims ({section.verifiable_claims.length})</h4>
                            <ul className="space-y-2">
                              {section.verifiable_claims.map((claim: string, cIdx: number) => (
                                <li key={cIdx} className="text-sm bg-orange-50 p-2 rounded-md border-l-4 border-orange-500">
                                  • {claim}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {section.contextual_briefing && Object.keys(section.contextual_briefing).length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Contextual Briefing</h4>
                            <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-x-auto">
                              {JSON.stringify(section.contextual_briefing, null, 2)}
                            </pre>
                          </div>
                        )}

                        {section.additional_data && Object.keys(section.additional_data).length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Additional Data</h4>
                            <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-x-auto">
                              {JSON.stringify(section.additional_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw JSON Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Raw Data (Developer View)</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowRawJson(!showRawJson)}
            >
              {showRawJson ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showRawJson ? 'Hide' : 'Show'} Raw JSON
            </Button>
          </CardTitle>
        </CardHeader>
        {showRawJson && (
          <CardContent>
            <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}