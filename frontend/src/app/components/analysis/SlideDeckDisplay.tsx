// /app/components/SlideDeckDisplay.tsx

"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, PlusCircle, Trash2 } from "lucide-react";
import { Slide } from "@/app/_global/interface";
import { EditableField } from "./EditableField"; // Assuming you have this component

// --- PROPS INTERFACE ---
interface SlideDeckDisplayProps {
  slides: Slide[];
  isEditMode: boolean;
  onAddSlide: () => void;
  onDeleteSlide: (slideIndex: number) => void;
  onSlideTitleChange: (slideIndex: number, newTitle: string) => void;
  onAddBullet: (slideIndex: number) => void;
  onDeleteBullet: (slideIndex: number, bulletIndex: number) => void;
  onSlideChange: (
    slideIndex: number,
    bulletIndex: number,
    newValue: string
  ) => void;
}

export const SlideDeckDisplay: React.FC<SlideDeckDisplayProps> = ({
  slides,
  isEditMode,
  onAddSlide,
  onDeleteSlide,
  onSlideTitleChange,
  onAddBullet,
  onDeleteBullet,
  onSlideChange,
}) => {
  // --- RENDER LOGIC ---
  if (!slides || slides.length === 0) {
    if (!isEditMode) return null; // Don't show anything if not in edit mode
    return (
      <Card className="text-center py-10 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-slate-500">
            Presentation Outline is Empty
          </CardTitle>
        </CardHeader>
        <Button variant="default" onClick={onAddSlide}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Your First Slide
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6">
      <CardHeader className="p-2 mb-4">
        <CardTitle className="text-xl">Presentation Outline</CardTitle>
      </CardHeader>
      <Accordion type="multiple" className="w-full space-y-3">
        {slides.map((slide, slideIndex) => (
          <AccordionItem
            key={slideIndex}
            value={`slide-${slideIndex}`}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border"
          >
            <AccordionTrigger className="p-4 hover:no-underline">
              <div className="flex items-center w-full gap-4">
                <span className="font-mono text-sm text-slate-400">
                  {slideIndex + 1}
                </span>
                <div className="flex-1 text-left">
                  <EditableField
                    isEditing={isEditMode}
                    value={slide.slide_title}
                    onChange={(newValue) =>
                      onSlideTitleChange(slideIndex, newValue)
                    }
                    placeholder="Enter slide title..."
                    className="font-semibold text-base"
                  />
                </div>
                {isEditMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent accordion from toggling
                      onDeleteSlide(slideIndex);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <ul className="list-none space-y-2 pl-6">
                  {slide.slide_bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="flex items-start">
                      <span className="mr-3 text-indigo-500 mt-1">▪</span>
                      <EditableField
                        isEditing={isEditMode}
                        value={bullet}
                        onChange={(newValue) =>
                          onSlideChange(slideIndex, bulletIndex, newValue)
                        }
                        onDelete={() => onDeleteBullet(slideIndex, bulletIndex)}
                        isTextarea
                        className="flex-1 font-normal text-slate-700 text-sm"
                      />
                    </li>
                  ))}
                </ul>
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 ml-9"
                    onClick={() => onAddBullet(slideIndex)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Bullet
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {isEditMode && (
        <div className="mt-6">
          <Button variant="default" onClick={onAddSlide}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Slide
          </Button>
        </div>
      )}
    </Card>
  );
};
