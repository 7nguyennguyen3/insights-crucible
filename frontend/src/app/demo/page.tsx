// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { useRouter } from "next/navigation";

// // --- 1. IMPORT YOUR NEW DATA ---
// import { demoVideos } from "@/lib/data";

// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Switch } from "@/components/ui/switch";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";

// import {
//   ArrowRight,
//   Briefcase,
//   CheckCircle,
//   Clock, // Import Clock icon for duration
//   FileText,
//   Lightbulb,
//   Newspaper,
//   Sparkles,
//   Twitter,
//   Youtube,
// } from "lucide-react";

// // --- 2. ADD DURATION PARSING HELPER ---
// const parseAndFormatDuration = (isoDuration: string) => {
//   const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
//   const matches = isoDuration.match(regex);

//   if (!matches) return "0:00";

//   const hours = parseInt(matches[1] || "0", 10);
//   const minutes = parseInt(matches[2] || "0", 10);
//   const seconds = parseInt(matches[3] || "0", 10);

//   const ss = String(seconds).padStart(2, "0");
//   if (hours > 0) {
//     const hh = String(hours);
//     const mm = String(minutes).padStart(2, "0");
//     return `${hh}:${mm}:${ss}`;
//   } else {
//     const mm = String(minutes);
//     return `${mm}:${ss}`;
//   }
// };

// const DemoPage = () => {
//   const router = useRouter();
//   const [selectedVideoId, setSelectedVideoId] = useState<string>(
//     demoVideos[0].id
//   );
//   const [openInNewTab, setOpenInNewTab] = useState(true);

//   const selectedVideo = demoVideos.find((v) => v.id === selectedVideoId);

//   const handleViewResult = () => {
//     if (!selectedVideo || selectedVideo.resultUrl === "#") {
//       alert("Result for this demo video is not available yet.");
//       return;
//     }
//     if (openInNewTab) {
//       window.open(selectedVideo.resultUrl, "_blank");
//     } else {
//       router.push(selectedVideo.resultUrl);
//     }
//   };

//   return (
//     <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
//         <header className="text-center mb-12">
//           <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
//             Product Demo
//           </h1>
//           <p className="mt-3 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
//             Test drive Insights Crucible with our pre-analyzed examples. No
//             sign-in required.
//           </p>
//         </header>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
//           <div className="lg:col-span-2 space-y-8">
//             <Card className="shadow-lg dark:bg-slate-900/70">
//               <CardHeader>
//                 <CardTitle className="text-2xl">
//                   1. Choose a Demo Video
//                 </CardTitle>
//                 <CardDescription>
//                   Select one of the pre-analyzed videos to see its generated
//                   report.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {/* --- 3. UPDATE THE JSX TO DISPLAY NEW DATA --- */}
//                 <RadioGroup
//                   value={selectedVideoId}
//                   onValueChange={setSelectedVideoId}
//                   className="space-y-3"
//                 >
//                   {demoVideos.map((video) => (
//                     <Label
//                       key={video.id}
//                       htmlFor={video.id}
//                       className="flex items-start md:items-center space-x-4 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20 transition-all"
//                     >
//                       <RadioGroupItem
//                         value={video.id}
//                         id={video.id}
//                         className="mt-1 md:mt-0"
//                       />
//                       <Image
//                         src={video.thumbnailUrl}
//                         alt={video.title}
//                         width={120}
//                         height={90}
//                         className="rounded-md object-cover flex-shrink-0"
//                       />
//                       <div className="flex-1">
//                         <p className="font-semibold text-base leading-snug">
//                           {video.title}
//                         </p>
//                         <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
//                           {video.channelName}
//                         </p>
//                         <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
//                           <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />
//                           <span>{parseAndFormatDuration(video.duration)}</span>
//                         </div>
//                       </div>
//                     </Label>
//                   ))}
//                 </RadioGroup>
//                 <Alert className="mt-6 bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
//                   <FileText className="h-4 w-4" />
//                   <AlertTitle>Want to analyze your own content?</AlertTitle>
//                   <AlertDescription>
//                     Pasting transcripts and uploading files is not available in
//                     the demo.
//                     {/* This div will contain the second line */}
//                     <div>
//                       <Link href="/auth" className="font-bold underline">
//                         Sign up for free
//                       </Link>
//                       <span className="ml-1">to unlock all features.</span>
//                     </div>
//                   </AlertDescription>
//                 </Alert>
//               </CardContent>
//             </Card>

//             <Card className="shadow-lg dark:bg-slate-900/70">
//               <CardHeader>
//                 <CardTitle className="text-2xl flex items-center gap-2">
//                   <Sparkles className="w-6 h-6 text-blue-500" />
//                   <span>2. Analysis Type</span>
//                 </CardTitle>
//                 <CardDescription>
//                   This option determines the format of the report. (Pre-set for
//                   demo)
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {/* We replaced the entire RadioGroup with a simple div grid */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {/* General Report (Selected State) */}
//                   <div className="flex flex-col items-start space-x-3 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-not-allowed border-blue-500 ">
//                     <div className="flex items-center justify-between w-full">
//                       <div className="flex items-center">
//                         <FileText className="w-5 h-5 mr-3 text-slate-500" />
//                         <p className="font-semibold">General Report</p>
//                       </div>
//                       {/* Fake "selected" radio button */}
//                       <div className="relative flex h-4 w-4 items-center justify-center rounded-full border border-blue-500">
//                         <div className="h-2 w-2 rounded-full bg-blue-500" />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Consultant Workbench (Unselected State with Tooltip) */}
//                   <TooltipProvider>
//                     <Tooltip delayDuration={100}>
//                       <TooltipTrigger asChild>
//                         <div className="flex flex-col items-start space-x-3 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-not-allowed h-full text-left">
//                           <div className="flex items-center justify-between w-full">
//                             <div className="flex items-center">
//                               <Briefcase className="w-5 h-5 mr-3 text-slate-500" />
//                               <p className="font-semibold">
//                                 Consultant Workbench
//                               </p>
//                             </div>
//                             {/* Fake "unselected" radio button */}
//                             <div className="h-4 w-4 rounded-full border border-slate-400" />
//                           </div>
//                         </div>
//                       </TooltipTrigger>
//                       <TooltipContent>
//                         <p>This option is not selectable in the demo.</p>
//                       </TooltipContent>
//                     </Tooltip>
//                   </TooltipProvider>
//                 </div>
//               </CardContent>
//             </Card>

//           </div>

//           {/* --- Launchpad Card (Modified to reflect new default) --- */}
//           <div className="lg:col-span-1 lg:sticky top-24 space-y-6">
//             <Card className="shadow-2xl dark:bg-slate-900/70">
//               <CardHeader>
//                 <CardTitle className="text-2xl">Launchpad</CardTitle>
//                 <CardDescription>
//                   Ready to see what our analysis looks like?
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <h4 className="font-semibold">Your Selection:</h4>
//                 <div className="mt-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 space-y-1">
//                   <p className="font-bold text-slate-800 dark:text-slate-200">
//                     {selectedVideo?.title}
//                   </p>
//                   <p className="text-sm text-slate-500 dark:text-slate-400">
//                     From: {selectedVideo?.channelName}
//                   </p>
//                   <p className="text-sm text-slate-500 dark:text-slate-400">
//                     {/* Updated to show new default */}
//                     Analysis Type: General Report
//                   </p>
//                   <p className="text-sm text-slate-500 dark:text-slate-400">
//                     Features: All Included
//                   </p>
//                 </div>
//               </CardContent>
//               <CardFooter className="flex-col space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
//                 <Button
//                   size="lg"
//                   className="w-full bg-green-600 hover:bg-green-700"
//                   onClick={handleViewResult}
//                 >
//                   View Result
//                   <ArrowRight className="ml-2 w-4 h-4" />
//                 </Button>
//                 <div className="flex items-center space-x-2 self-start">
//                   <Checkbox
//                     id="new-tab-checkbox"
//                     checked={openInNewTab}
//                     onCheckedChange={(checked) =>
//                       setOpenInNewTab(checked as boolean)
//                     }
//                   />
//                   <Label
//                     htmlFor="new-tab-checkbox"
//                     className="text-sm font-medium text-slate-600 dark:text-slate-400"
//                   >
//                     Open result in a new tab
//                   </Label>
//                 </div>
//               </CardFooter>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// };

// export default DemoPage;

import React from "react";

const DemoPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      This page is under construction. Please come back later.
    </div>
  );
};

export default DemoPage;
