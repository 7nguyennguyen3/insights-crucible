"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ShowNotes, PodcasterSection } from "@/types/analysis";

interface PodcasterViewProps {
  showNotes: ShowNotes;
  sectionAnalyses?: PodcasterSection[];
}

export default function PodcasterView({ showNotes, sectionAnalyses }: PodcasterViewProps) {
  const [copiedItems, setCopiedItems] = useState<{ [key: string]: boolean }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({});

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems({ ...copiedItems, [itemId]: true });
      toast.success("Copied to clipboard!");
      setTimeout(() => {
        setCopiedItems({ ...copiedItems, [itemId]: false });
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const toggleSection = (sectionNumber: number) => {
    setExpandedSections({
      ...expandedSections,
      [sectionNumber]: !expandedSections[sectionNumber],
    });
  };

  return (
    <div className="space-y-8">
      {/* Title Variations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎯</span> Episode Title Variations
          </CardTitle>
          <CardDescription>
            Choose the title that best fits your audience and platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(showNotes.title_variations).map(([type, title]) => (
            <div key={type} className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
              <div className="flex-1">
                <Badge variant="outline" className="mb-2 capitalize">
                  {type.replace("_", " ")}
                </Badge>
                <p className="text-sm font-medium">{title}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(title, `title-${type}`)}
              >
                {copiedItems[`title-${type}`] ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Episode Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📝</span> Episode Description
          </CardTitle>
          <CardDescription>SEO-optimized description for your podcast platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm whitespace-pre-wrap">{showNotes.episode_description}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => copyToClipboard(showNotes.episode_description, "description")}
          >
            {copiedItems["description"] ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Description
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💡</span> Key Points
          </CardTitle>
          <CardDescription>Main topics and insights covered in this episode</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {showNotes.key_points.map((point, index) => (
              <li key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                <Badge variant="secondary" className="mt-0.5">{index + 1}</Badge>
                <p className="text-sm flex-1">{point}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Notable Quotes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💬</span> Notable Quotes
          </CardTitle>
          <CardDescription>Shareable soundbites with timestamps for clips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNotes.notable_quotes.map((quoteObj, index) => (
            <div key={index} className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-start justify-between gap-4 mb-2">
                <Badge variant="outline">{quoteObj.timestamp}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(quoteObj.quote, `quote-${index}`)}
                >
                  {copiedItems[`quote-${index}`] ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <blockquote className="text-sm italic mb-2 border-l-2 border-slate-400 pl-3">
                "{quoteObj.quote}"
              </blockquote>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Context: {quoteObj.context}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chapters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📑</span> Chapters & Timestamps
          </CardTitle>
          <CardDescription>Navigation markers for YouTube and podcast platforms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showNotes.chapters.map((chapter, index) => (
            <div key={index} className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{chapter.timestamp}</Badge>
                    <h4 className="font-medium text-sm">{chapter.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {chapter.summary}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Social Content Pack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🚀</span> Social Content Pack
          </CardTitle>
          <CardDescription>
            Platform-native promotional content ready to publish
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="linkedin">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
            </TabsList>

            {/* LinkedIn Post */}
            <TabsContent value="linkedin" className="space-y-3">
              <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm whitespace-pre-wrap mb-4">
                  {showNotes.social_content.linkedin_post}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(showNotes.social_content.linkedin_post, "linkedin")
                  }
                >
                  {copiedItems["linkedin"] ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy LinkedIn Post
                    </>
                  )}
                </Button>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>📌 Style: Storytelling "bro-etry" format</p>
                <p>📌 Length: 200-300 words</p>
                <p>📌 Format: Short paragraphs, conversational tone</p>
              </div>
            </TabsContent>

            {/* Twitter Thread */}
            <TabsContent value="twitter" className="space-y-3">
              <div className="space-y-2">
                {showNotes.social_content.twitter_thread.map((tweet, index) => (
                  <div key={index} className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <Badge variant="secondary">Tweet {index + 1}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(tweet, `tweet-${index}`)}
                      >
                        {copiedItems[`tweet-${index}`] ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm">{tweet}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {tweet.length} characters
                    </p>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copyToClipboard(
                    showNotes.social_content.twitter_thread.join("\n\n"),
                    "twitter"
                  )
                }
              >
                {copiedItems["twitter"] ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Full Thread
                  </>
                )}
              </Button>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mt-3">
                <p>📌 Style: Educational breakdown format</p>
                <p>📌 Length: 5-7 tweets under 280 chars each</p>
                <p>📌 Structure: Hook → Breakdown → CTA</p>
              </div>
            </TabsContent>

            {/* YouTube Description */}
            <TabsContent value="youtube" className="space-y-3">
              <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm whitespace-pre-wrap mb-4">
                  {showNotes.social_content.youtube_description}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(showNotes.social_content.youtube_description, "youtube")
                  }
                >
                  {copiedItems["youtube"] ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy YouTube Description
                    </>
                  )}
                </Button>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>📌 Style: SEO & Navigation heavy</p>
                <p>📌 Length: 150-250 words</p>
                <p>📌 Includes: Keywords, timestamps, CTAs</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Section-by-Section Analysis (Optional, Collapsible) */}
      {sectionAnalyses && sectionAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔍</span> Section-by-Section Analysis
            </CardTitle>
            <CardDescription>
              Detailed breakdown of each section (for reference)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sectionAnalyses.map((section) => (
              <Collapsible
                key={section.section_number}
                open={expandedSections[section.section_number]}
                onOpenChange={() => toggleSection(section.section_number)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Badge>Section {section.section_number}</Badge>
                        <span className="font-medium text-sm">{section.section_title}</span>
                        <Badge variant="outline" className="text-xs">
                          {section.timestamp_start} - {section.timestamp_end}
                        </Badge>
                      </div>
                      {expandedSections[section.section_number] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 pt-0">
                    <Separator className="mb-4" />
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Summary</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {section.summary}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-2">Key Points</h5>
                        <ul className="space-y-1">
                          {section.key_points.map((point, idx) => (
                            <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 pl-4">
                              • {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {section.notable_quotes.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Notable Quotes</h5>
                          <div className="space-y-2">
                            {section.notable_quotes.map((quote, idx) => (
                              <div key={idx} className="text-sm">
                                <Badge variant="outline" className="text-xs mb-1">
                                  {quote.timestamp}
                                </Badge>
                                <blockquote className="italic text-slate-600 dark:text-slate-400 border-l-2 border-slate-300 pl-2">
                                  "{quote.quote}"
                                </blockquote>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card className="bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Analysis Type: Podcaster (Production-Focused)</span>
            <span>Total Sections: {showNotes.total_sections}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
