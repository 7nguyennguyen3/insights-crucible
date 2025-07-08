export interface HighlightableInsight {
  text: string;
  highlightId: string;
}

export interface BaseAnalysisSection {
  start_time: string;
  end_time: string;
}

export interface HighlightableQuestionAndAnswer {
  question: string;
  answer: HighlightableInsight;
}

export interface InteractiveGeneralSection extends BaseAnalysisSection {
  id: string;
  analysis_persona: "general";
  generated_title: string;
  "1_sentence_summary": HighlightableInsight;
  summary_points: HighlightableInsight[];
  actionable_advice: HighlightableInsight[];
  notable_quotes: HighlightableInsight[];
  // Add this line
  questions_and_answers?: HighlightableQuestionAndAnswer[];
  key_entities: HighlightableInsight[];
}

export interface InteractiveConsultantSection extends BaseAnalysisSection {
  id: string;
  analysis_persona: "consultant";
  section_title: string;
  executive_summary: HighlightableInsight;
  client_pain_points: HighlightableInsight[];
  strategic_opportunities: HighlightableInsight[];
  critical_quotes: HighlightableInsight[];
  open_questions: string[]; // No highlighting needed for generated questions
}

// Job-level metadata interfaces
export interface ArgumentStructure {
  main_thesis: string;
  supporting_arguments: string[];
  counterarguments_mentioned: string[];
}

export interface SynthesisResults {
  overarching_themes: string[];
  unifying_insights: string[];
  key_contradictions: { analysis: string; point_a: string; point_b: string }[];
  narrative_arc: string;
}

// Represents the full analysis payload for a single persona for one transcript
export interface DemoAnalysisPayload {
  argument_structure?: ArgumentStructure;
  synthesis_results?: SynthesisResults;
  sections: (InteractiveGeneralSection | InteractiveConsultantSection)[];
}

export interface DemoTranscript {
  id: string;
  title: string;
  transcript: string;
}

export const demoTranscripts: DemoTranscript[] = [
  {
    id: "enterprise_sales_stall",
    title: "Enterprise Sales Strategy Teardown",
    transcript: `
    <div data-section-id="sec1" data-start-time="0" data-end-time="315">
      [00:53] Mark O'Connell: <span data-highlight-id="qa-s1-1"><span data-highlight-id="quote-stagnation">The main challenge is stagnation.</span> That's the word for it.</span> <span data-highlight-id="gen-s1-sum-1">For three years, we were on a rocket ship. We were growing 150% year-over-year.</span> The sales team was hitting their numbers, the champagne was flowing. It felt easy. <span data-highlight-id="pain-brick-wall">Then, about a year ago, we made a strategic decision to move upmarket... And that’s when we hit a brick wall.</span> <span data-highlight-id="gen-s1-sum-2">Our growth has flattened to maybe 10% year-over-year, and my forecast for the next two quarters is looking even softer.</span>
      <br><br>
      [02:02] Mark O'Connell: <span data-highlight-id="qa-s1-2"><span data-highlight-id="pain-velocity-game">It was a velocity game. Pure and simple. We had a great inbound engine</span>, thanks to marketing. An SDR would qualify them in a 15-minute call, and an Account Executive, an AE, would have the deal closed within 30 to 45 days. The average contract value, or ACV, was around $25,000. It was transactional.</span>
      <br><br>
      [02:47] Mark O'Connell: <span data-highlight-id="qa-s1-3">It's a different universe. The ACV isn't $25k, it's $250k, maybe even half a million. The sales cycle isn't 30 days, it's 9 to 12 months. You're not talking to a single IT manager; you're navigating a buying committee of six to ten people across legal, finance, security, and multiple business units. <span data-highlight-id="quote-consultative">It's a complex, multi-threaded sale that requires a consultative approach.</span></span>
      <br><br>
      [03:45] Mark O'Connell: <span data-highlight-id="qa-s1-4"><span data-highlight-id="quote-mess">It’s a mess, Sarah. It’s a complete mess.</span> <span data-highlight-id="pain-inbound-fail">Our inbound-heavy model doesn't work for landing a company like Johnson & Johnson.</span> We've tried to bolt on an outbound, <span data-highlight-id="entity-abm">Account-Based Marketing—or ABM</span>—strategy, but it feels... <span data-highlight-id="pain-amateurish">amateurish.</span></span> We bought all the expensive tools, we have Outreach for sequencing, we use LinkedIn Sales Navigator, but the team is just throwing spaghetti at the wall. <span data-highlight-id="pain-generic-messaging">The messaging is generic. The SDRs are sending the same email to a VP at a Fortune 500 company that they'd send to a startup.</span> <span data-highlight-id="pain-abysmal-conversion">The conversion from a cold outreach to a qualified first meeting is abysmal. I think it's under 1%.</span>
      <br><br>
      [04:42] Mark O'Connell: <span data-highlight-id="qa-s1-5">All of the above. <span data-highlight-id="pain-no-icp">We don't have a defined Ideal Customer Profile, an ICP, for the enterprise segment.</span> So the SDRs don't know who to target. <span data-highlight-id="pain-no-playbook">We don't have a real sales playbook for outbound, so they don't know what to say.</span> <span data-highlight-id="pain-no-value-prop">There's no value proposition tailored to a Chief Financial Officer versus a Chief Technology Officer.</span></span> <span data-highlight-id="quote-spray-and-pray">It's spray and pray, and it's burning through our budget and our reputation.</span>
    </div>
    <div data-section-id="sec2" data-start-time="327" data-end-time="665">
      [05:27] Mark O'Connell: <span data-highlight-id="pain-handoff-fail">The handoff is another point of failure.</span> It happens in Salesforce, and frankly, <span data-highlight-id="quote-sf-disaster">our Salesforce instance is a disaster zone.</span> There are no standardized fields for the information an AE needs. The notes from the SDR are often just a couple of cryptic sentences. So the AE goes into that first major call with a potential six-figure client effectively blind.
      <br><br>
      [06:12] Mark O'Connell: <span data-highlight-id="qa-s2-1">Oh, where to begin. It was set up five years ago for the high-velocity, simple sales model. It's never been overhauled. We have duplicate records everywhere. Data is incomplete. AEs don't update it consistently because it's so clunky. <span data-highlight-id="pain-shadow-crm">They all have their own "shadow CRMs" in spreadsheets or personal notes.</span> As a result, <span data-highlight-id="pain-no-visibility">I have zero visibility into the pipeline. I can't generate a reliable forecast to save my life.</span></span> <span data-highlight-id="quote-black-box">For a company called 'DataWeave Analytics,' it’s incredibly ironic that our own sales data is a black box. We're flying blind, trying to land a 747 with the instruments from a Cessna.</span>
      <br><br>
      [07:23] Mark O'Connell: <span data-highlight-id="qa-s2-2">No. That's the other big gap. <span data-highlight-id="pain-no-methodology">We have no standardized sales methodology.</span> Some of my reps who came from other companies try to use what they know... you hear them mention <span data-highlight-id="entity-meddic">MEDDIC or Challenger Sale</span>, but there's no formal adoption, no training, no reinforcement. So every single AE is running their deals differently.</span> <span data-highlight-id="pain-gut-feel">There's no common language for deal reviews. There's no checklist for what constitutes a "qualified" opportunity at Stage 3 versus Stage 4. It's all gut feel.</span> This leads to massive pipeline inflation.
      <br><br>
      [08:18] Mark O'Connell: <span data-highlight-id="qa-s2-3">It's crushing them. <span data-highlight-id="pain-reps-leaving">My top performers from the mid-market days are struggling the most... I've had two of my best reps leave in the last six months for jobs at companies that have a more transactional model.</span> <span data-highlight-id="pain-low-morale">The team's morale is low. They feel like they're being set up to fail, and frankly, I don't blame them.</span></span>
      <br><br>
      [09:03] Mark O'Connell: <span data-highlight-id="qa-s2-4"><span data-highlight-id="pain-skill-gap">It's wide. They're great at demoing the product... But they're not business consultants. They don't know how to read a balance sheet or have a conversation with a VP of Finance about Total Cost of Ownership.</span> They don't know how to build a champion internally. They don't know how to navigate competitive bake-offs.</span>
      <br><br>
      [10:04] Mark O'Connell: <span data-highlight-id="qa-s2-5">It's almost always <span data-highlight-id="entity-synthcorp">SynthCorp</span>. They're our boogeyman... Their product isn't even as good as ours!... But they win the deals. <span data-highlight-id="pain-losing-to-gtm">Their go-to-market is just... slicker. Their salespeople are polished.</span> They have an army of sales engineers and value consultants... We show up with a standard demo.</span> <span data-highlight-id="quote-knife-gunfight">It's like we're bringing a knife to a gunfight.</span>
      <br><br>
      [11:05] Mark O'Connell: <span data-highlight-id="arg-wrapper">So the challenge isn't the product, it's the entire commercial wrapper around the product—the sales process, the methodology, the team's skills, and the competitive strategy.</span>
    </div>
    <div data-section-id="sec3" data-start-time="675" data-end-time="1044">
      [11:15] Mark O'Connell: <span data-highlight-id="counter-arg">My engineers and product guys don't always get it. They say, "But our product is better!"</span> and I say, "It doesn't matter if we can't get it in front of the right people with the right message and shepherd the deal to a close." <span data-highlight-id="qa-s3-1"><span data-highlight-id="quote-d-grade">A great product with a C-grade sales process will lose to a B-grade product with an A-grade sales process every single time. And right now, we're operating with a D-grade process.</span></span>
      <br><br>
      [12:02] Mark O'Connell: I wish I could track everything. Right now, I can track activity metrics—number of calls, number of emails sent. <span data-highlight-id="pain-vanity-metrics">Useless, vanity metrics.</span> <span data-highlight-id="qa-s3-2"><span data-highlight-id="pain-no-metrics">What I need is performance metrics. I need to see my lead-to-opportunity conversion rate by source. I need to see my pipeline velocity—how long deals are sitting in each stage. I need to know my Customer Acquisition Cost—CAC—for an enterprise customer... I need to know our win-rate against competitors like SynthCorp.</span> I can't see any of this reliably.</span> <span data-highlight-id="quote-gut-feel">I'm making multi-million dollar decisions based on anecdotes and gut feel.</span>
      <br><br>
      [14:14] Mark O'Connell: <span data-highlight-id="qa-s3-3"><span data-highlight-id="pain-product-onboarding">Onboarding is a two-week program focused almost entirely on product knowledge.</span> <span data-highlight-id="quote-api-vs-pain">A new hire can tell you about every API endpoint we have, but they can't tell you the top three business pains of a Chief Marketing Officer.</span> <span data-highlight-id="pain-no-training">We have no ongoing training. No reinforcement.</span> We did a one-day "consultative selling" workshop last year, and it was a complete waste of money... because there was no follow-up, no change in management, no coaching from the frontline managers to support it. <span data-highlight-id="pain-managers-not-coaches">Our managers are glorified deal-chasers. They're not coaches, because they were our best AEs from the old model.</span></span>
      <br><br>
      [15:12] Mark O'Connell: A hundred percent. <span data-highlight-id="quote-classic-mistake">We promoted our best players to be coaches, without ever teaching them how to coach. It's the classic mistake.</span>
      <br><br>
      [15:37] Mark O'Connell: <span data-highlight-id="qa-s3-4">That's a fair question. Our biggest asset, without a doubt, is the <span data-highlight-id="strength-product">product. It truly is excellent and our customers who use it, love it. Our Net Promoter Score is over 60, which is world-class for B2B SaaS.</span> Second, I do have a <span data-highlight-id="strength-team">core group of people on the team who are hungry.</span> They're frustrated, yes, but they're smart and they want to win. And third... well, we have the <span data-highlight-id="strength-budget">budget to fix this. The board is committed to the enterprise strategy</span>; they know it's not a simple switch.</span>
      <br><br>
      [16:38] Sarah Jenkins: That's the perfect place to end for today. A great product, a motivated core team, and executive support. Those are powerful building blocks. You've given me a phenomenal amount of information to work with. My next steps will be to synthesize this and combine it with the interviews I'm having with your marketing and customer success counterparts. We'll start to form some initial hypotheses on the highest-priority workstreams, which we'll then validate with you and the rest of the leadership team in a couple of weeks.
      <br><br>
      [17:08] Mark O'Connell: That sounds great, Sarah. I'm looking forward to it. And really, thanks for listening. It was actually therapeutic to just lay it all out like that.
      <br><br>
      [17:18] Sarah Jenkins: That's what I'm here for. I'll be in touch to schedule our next checkpoint. Have a great rest of your day.
      <br><br>
      [17:24] Mark O'Connell: You too.
    </div>
  `,
  },
  {
    id: "engineering_team_employee_turnover",
    title: "Engineering Team Employee Turnover",
    transcript: `
<div data-section-id="sec1" data-start-time="0" data-end-time="249">
[00:10] Jessica Alvarez: <span data-highlight-id="gen-s1-q-1">It feels like every month I'm approving another backfill position for a good engineer who has decided to leave.</span>
<br><br>
[00:22] David Chen: <span data-highlight-id="gen-s1-sp-1">I've seen the numbers—voluntary turnover is up 15% year‑over‑year for your department, well above the company average.</span> <span data-highlight-id="consultant-s1-pain-1">What are you hearing on the ground?</span>
<br><br>
[00:35] Jessica Alvarez: <span data-highlight-id="qa-s1-1">Well, the official reason is almost always the same: compensation. The exit interviews HR conducts are clear. A competitor offers them 20% more, and they're gone.</span>
<br><br>
[01:07] Jessica Alvarez: <span data-highlight-id="gen-s1-sp-2">That’s the thing. Now that you mention it... <span data-highlight-id="qa-s1-2">it's not our junior engineers who are leaving. It's the senior ones. The people who have been here for three to five years, who are our most productive contributors.</span></span> <span data-highlight-id="consultant-s1-pain-2">And when they leave, it's not just a backfill; we lose an immense amount of institutional knowledge.</span> <span data-highlight-id="consultant-s1-quote-1">The project roadmaps for their teams get completely derailed for a quarter while we try to hire and ramp up a replacement.</span>
<br><br>
[01:32] Jessica Alvarez: <span data-highlight-id="gen-s1-aa-1"><span data-highlight-id="qa-s1-3">I think... I think it's about career growth. Or the lack thereof.</span></span> <span data-highlight-id="consultant-s1-opp-1">We have a very traditional ladder... many of our best coders have no desire to become managers. They want to become principal engineers.</span> <span data-highlight-id="gen-s1-q-2">We don't have a formal track for that. So when they hit that 'senior' ceiling, the only way to get a promotion and a significant pay bump is to leave for a company that has a mature technical track.</span> <span data-highlight-id="consultant-s1-quote-2">That's a critical insight.</span>
<br><br>
[01:59] Jessica Alvarez: <span data-highlight-id="qa-s1-4"><span data-highlight-id="gen-s1-sp-3">Our onboarding is another weak point. It’s very ad‑hoc.</span> <span data-highlight-id="gen-s1-aa-2">We throw a new hire at a mountain of documentation, give them a few starter bugs to fix, and then assign them to a team. There’s no structured mentorship program.</span></span> <span data-highlight-id="consultant-s1-pain-3">They often tell me in their 90‑day check‑ins that they feel disconnected from the big picture and aren't sure if their work is making an impact.</span> <span data-highlight-id="consultant-s1-opp-2">They feel like a cog in the machine.</span>
<br><br>
[02:09] David Chen: <span data-highlight-id="gen-s1-q-3">So a senior engineer can't see a future, and a junior engineer can't see their impact. It sounds like two sides of the same coin.</span>
<br><br>
[02:29] Jessica Alvarez: <span data-highlight-id="gen-s1-sp-4">Exactly. And it puts a massive strain on my Engineering Managers.</span> <span data-highlight-id="gen-s1-aa-3">They're trying to hit aggressive deadlines... while also trying to be mentors... They're spread too thin.</span> <span data-highlight-id="consultant-s1-pain-4">Their 1‑on‑1s get cancelled, performance reviews are rushed, and they don't have the bandwidth to really talk about career development with their people.</span> <span data-highlight-id="consultant-s1-opp-3">They've told me they feel like they're failing their teams, but the pressure to ship features is relentless.</span>
<br><br>
[02:54] Jessica Alvarez: <span data-highlight-id="qa-s1-5"><span data-highlight-id="gen-s1-aa-4">When we were smaller, everyone felt like a founder. We were all in one room, the mission was clear, and collaboration was natural. Now, we're 300 people. We've become siloed.</span></span> <span data-highlight-id="gen-s1-sp-5">Engineering and Product are often at odds. The product team throws requirements "over the wall," and my engineers feel like they're just a feature factory without any creative input into the "why."</span> <span data-highlight-id="consultant-s1-pain-5">That initial spark, that feeling of building something together, has faded. It's become more of a job and less of a mission.</span>
<br><br>
[03:19] Jessica Alvarez: <span data-highlight-id="gen-s1-summary">Yes. Hearing you say it back like that... it's much clearer.</span> <span data-highlight-id="consultant-s1-summary">It's not one single thing we can fix with money. It's a systemic problem with our career framework and our internal support systems.</span> <span data-highlight-id="gen-s1-q-4">We aren't developing our talent; we're just using them until they burn out or get a better offer.</span> <span data-highlight-id="consultant-s1-quote-3">This is incredibly helpful, Jessica.</span>
<br><br>
[03:39] David Chen: <span data-highlight-id="gen-s1-aa-5">My plan is to take these qualitative themes and cross‑reference them with the HR data we have.</span> <span data-highlight-id="consultant-s1-opp-4">We can look at things like promotion velocity, tenure at time of departure, and manager effectiveness scores from the last engagement survey.</span>
</div>
<div data-section-id="sec2" data-start-time="274" data-end-time="630">
[04:34] David Chen: <span data-highlight-id="gen-s2-aa-1">Let’s talk metrics to track improvements. What KPIs should we define to monitor progress?</span>
<br><br>
[04:54] Jessica Alvarez: <span data-highlight-id="qa-s2-1"><span data-highlight-id="gen-s2-sp-1">We could track retention by hire cohort at 3-, 6-, and 12‑month intervals, promotion velocity for IC and manager tracks, and manager effectiveness scores from our engagement survey.</span></span> <span data-highlight-id="gen-s2-q-1">This would give us a much clearer picture.</span> <span data-highlight-id="consultant-s2-opp-1">That's a great start.</span>
<br><br>
[05:09] David Chen: <span data-highlight-id="gen-s2-sp-2">Good. Let’s define targets: reduce senior voluntary turnover by 5 percentage points in six months, and improve new-hire 90-day retention by 10 percent.</span> <span data-highlight-id="gen-s2-aa-2">This will give us something concrete to aim for.</span> <span data-highlight-id="consultant-s2-quote-1">Those are ambitious but achievable goals.</span>
<br><br>
[05:54] Jessica Alvarez: <span data-highlight-id="qa-s2-2">We can have EngOps build the initial dashboard and HR can maintain and refine it.</span>
<br><br>
[06:34] Jessica Alvarez: <span data-highlight-id="qa-s2-3"><span data-highlight-id="gen-s2-q-2">Prototype in two weeks, then iterate monthly based on feedback.</span></span>
<br><br>
[06:49] David Chen: <span data-highlight-id="gen-s2-aa-3">Great. For career paths, we need to draft technical track levels.</span>
<br><br>
[06:59] Jessica Alvarez: <span data-highlight-id="qa-s2-4"><span data-highlight-id="gen-s2-sp-3">Perhaps IC‑1 through IC‑5, with principal engineer at IC‑4 and distinguished engineering at IC‑5.</span></span> <span data-highlight-id="consultant-s2-opp-2">This would provide the clarity and progression our senior engineers are looking for.</span>
<br><br>
[07:14] David Chen: <span data-highlight-id="gen-s2-aa-4">Sounds reasonable. Let’s workshop that with HR and a few senior engineers for buy‑in.</span>
<br><br>
[07:54] David Chen: <span data-highlight-id="gen-s2-aa-5">Perfect. Last, communication: how do we socialize these changes?</span>
<br><br>
[08:04] Jessica Alvarez: <span data-highlight-id="qa-s2-5"><span data-highlight-id="gen-s2-sp-4">Town hall announcement, updated career framework docs in Confluence, and follow‑up 1:1 discussions with each manager and their teams.</span></span> <span data-highlight-id="consultant-s2-opp-3">A multi-pronged approach is best.</span>
<br><br>
[09:04] David Chen: <span data-highlight-id="gen-s2-aa-6">Before we wrap, is there anything else on your mind—potential risks or dependencies?</span> <span data-highlight-id="consultant-s2-opp-4">It's important to get these on the table now.</span>
<br><br>
[09:29] Jessica Alvarez: <span data-highlight-id="qa-s2-6"><span data-highlight-id="gen-s2-sp-5">We might need budget approval for external coaching and career‑framework workshops.</span></span> <span data-highlight-id="gen-s2-q-3">This is a critical dependency.</span> <span data-highlight-id="consultant-s2-pain-1">I'll need to factor that into the proposal.</span> <span data-highlight-id="consultant-s2-quote-2">We can't move forward without it.</span>
<br><br>
[10:04] Jessica Alvarez: <span data-highlight-id="qa-s2-6"><span data-highlight-id="gen-s2-q-4">Also, engineering capacity is tight; we may need to reprioritize a sprint or two to free up time.</span></span> <span data-highlight-id="consultant-s2-pain-2">This will require careful negotiation with the Product team.</span> <span data-highlight-id="consultant-s2-quote-3">It's a trade-off we'll have to make.</span>
<br><br>
[10:14] David Chen: <span data-highlight-id="gen-s2-aa-7">Good point. Let’s align with Product on deprioritizing non‑critical work.</span>
<br><br>
[10:22] David Chen: <span data-highlight-id="consultant-s2-summary">Perfect. That should cover everything. Thanks, Jessica.</span>
</div>
`,
  },
];

export const allDemoAnalyses: Record<
  string,
  { general: DemoAnalysisPayload; consultant: DemoAnalysisPayload }
> = {
  enterprise_sales_stall: {
    consultant: {
      synthesis_results: {
        overarching_themes: [
          "Strategic Misalignment & Execution Gap: The client's strategic pivot to the enterprise market is fundamentally undermined by a sales motion, infrastructure, and team capabilities that are still rooted in a mid-market, transactional model, leading to severe growth stagnation.",
          "Data & Visibility Black Hole: Despite being a data analytics company, the client suffers from a critical internal deficiency in sales data quality, CRM hygiene, and pipeline visibility, rendering strategic decision-making anecdotal and hindering performance diagnosis.",
          "Sales Enablement & Capability Deficit: The sales organization lacks the specialized skills, methodologies, tailored messaging, and effective coaching required for complex enterprise deals, resulting in high attrition among top performers and consistent losses to competitors.",
          "Process & Infrastructure Immaturity: A 'D-grade' sales process, absence of standardized methodologies, ineffective lead handoffs, and a dysfunctional CRM are systemic bottlenecks preventing the client from leveraging its strong product and committed budget to achieve enterprise growth.",
        ],
        unifying_insights: [
          "The 'DataWeave Analytics' Irony as a Core Symptom: The most striking unifying insight is the profound irony that a company specializing in data analytics for its clients is internally crippled by a complete lack of reliable sales data. This isn't just a pain point; it's a symbolic representation of the entire organization's internal operational immaturity and misalignment, suggesting a deeper cultural or strategic blind spot regarding internal application of its core expertise.",
          "The Systemic Nature of the GTM Failure: The issues are not isolated but form a deeply interconnected web. The lack of an enterprise ICP feeds into ineffective outbound, which then clogs a dysfunctional CRM, leading to no pipeline visibility, which prevents data-driven decision-making, and exposes the lack of sales methodology and coaching, ultimately causing deal losses despite product strength. This is a full-stack GTM failure, indicating that piecemeal solutions will be ineffective; a holistic, systemic overhaul is required.",
          "Urgency Driven by Reputational Damage & Attrition: Beyond financial stagnation, the document reveals a critical erosion of internal morale ('set up to fail'), top performer attrition, and external reputational damage ('burning through... reputation'). These non-financial costs add a layer of urgency, indicating that the current state is not merely inefficient but actively destructive to the long-term health and viability of the sales organization and potentially the company's market standing, necessitating immediate and decisive intervention.",
        ],
        key_contradictions: [
          {
            analysis:
              "This highlights a profound internal inconsistency: a company that provides data analytics to others is critically crippled by its own lack of reliable internal sales data. This not only undermines operational efficiency but also raises questions about the company's internal application of its core expertise.",
            point_a:
              "The client is named 'DataWeave Analytics' and presumably sells data-driven solutions to its customers.",
            point_b:
              "Their internal sales data is described as a 'black box,' a 'disaster zone' in Salesforce, leading to 'flying blind' and making 'multi-million dollar decisions based on anecdotes and gut feel.'",
          },
          {
            analysis:
              "This contradiction underscores that product strength is not a sufficient condition for enterprise success. A superior product cannot compensate for a fundamentally broken sales process, inadequate sales capabilities, and a weak competitive GTM strategy. The GTM is the primary bottleneck, not the product itself.",
            point_a:
              "The client possesses a 'world-class product' with an NPS > 60 and low mid-market churn, indicating strong product-market fit.",
            point_b:
              "They consistently lose enterprise deals to competitors (primarily SynthCorp) who are perceived to have superior go-to-market strategy, sales support, and value articulation, despite potentially inferior products.",
          },
          {
            analysis:
              "This indicates a significant misallocation and ineffective utilization of resources. While capital is available, the lack of strategic direction, process, and capability means that investment is currently exacerbating problems rather than solving them, leading to wasted funds and brand damage.",
            point_a:
              "The board has committed a multi-million dollar budget to address the sales challenges.",
            point_b:
              "The current 'spray and pray' outbound strategy is 'burning through budget and reputation' with abysmal conversion rates (<1%).",
          },
        ],
        narrative_arc:
          "The core story of DataWeave Analytics is one of a promising strategic pivot hitting a 'brick wall.' The central conflict arose when the company, accustomed to rapid mid-market growth, decided to move upmarket to enterprise without adequately transforming its sales engine. This strategic misalignment cascaded into a multitude of operational failures: an 'amateurish' outbound strategy, a 'disaster zone' CRM, zero pipeline visibility, and a sales team ill-equipped for complex enterprise deals. The key turning point is the stark realization that product superiority alone is insufficient; a 'D-grade sales process' will consistently lose to a 'B-grade product with an A-grade sales process.' This insight reveals the ultimate strategic opportunity: to systematically overhaul the entire sales operating model – from data and process to people and enablement – to build an 'A-grade' enterprise sales engine capable of capitalizing on their strong product and board-committed budget.",
      },
      sections: [
        {
          id: "sec1",
          analysis_persona: "consultant",
          start_time: "00:00",
          end_time: "05:15",
          section_title: "Enterprise Sales Stagnation & Challenges",
          executive_summary: {
            text: "The client's growth has stalled significantly following a strategic pivot to the enterprise market, primarily due to an ineffective sales motion and lack of tailored strategy for complex, high-value deals.",
            highlightId: "pain-brick-wall",
          },
          client_pain_points: [
            {
              text: "Growth has flattened to 10% YoY, down from 150%, with softer forecasts.",
              highlightId: "gen-s1-sum-2",
            },
            {
              text: "Mid-market velocity sales motion (transactional, low ACV, short cycles) is ineffective for enterprise.",
              highlightId: "pain-velocity-game",
            },
            {
              text: "Inbound-heavy lead generation model does not work for enterprise accounts.",
              highlightId: "pain-inbound-fail",
            },
            {
              text: "Outbound/ABM strategy is 'amateurish' and 'a complete mess', despite investment in tools.",
              highlightId: "pain-amateurish",
            },
            {
              text: "Generic messaging and 'spray and pray' approach leading to abysmal cold outreach conversion (<1%).",
              highlightId: "pain-abysmal-conversion",
            },
            {
              text: "Lack of a defined Ideal Customer Profile (ICP) for the enterprise segment.",
              highlightId: "pain-no-icp",
            },
            {
              text: "Absence of a clear sales playbook for outbound enterprise efforts.",
              highlightId: "pain-no-playbook",
            },
            {
              text: "Burning through budget and damaging reputation with ineffective outreach.",
              highlightId: "quote-spray-and-pray",
            },
          ],
          strategic_opportunities: [
            {
              text: "Develop a distinct, consultative enterprise sales motion with longer cycles and higher ACV targets.",
              highlightId: "quote-consultative",
            },
            {
              text: "Implement a robust, targeted outbound and Account-Based Marketing (ABM) strategy.",
              highlightId: "entity-abm",
            },
            {
              text: "Define a clear Ideal Customer Profile (ICP) for the enterprise segment.",
              highlightId: "pain-no-icp",
            },
            {
              text: "Create a comprehensive sales playbook for enterprise outbound activities.",
              highlightId: "pain-no-playbook",
            },
            {
              text: "Develop tailored value propositions and messaging for specific enterprise stakeholders and business units.",
              highlightId: "pain-no-value-prop",
            },
          ],
          critical_quotes: [
            {
              text: '"The main challenge is stagnation."',
              highlightId: "quote-stagnation",
            },
            {
              text: '"Then, about a year ago, we made a strategic decision to move upmarket... And that’s when we hit a brick wall."',
              highlightId: "pain-brick-wall",
            },
            {
              text: "\"It's spray and pray, and it's burning through our budget and our reputation.\"",
              highlightId: "quote-spray-and-pray",
            },
          ],
          open_questions: [
            "What is the current estimated Customer Acquisition Cost (CAC) for an enterprise customer, and how does it compare to their first-year contract value?",
            "Which specific tools are being used for the 'amateurish' ABM strategy and is the issue the tech or the process?",
            "Who would be the key cross-functional stakeholders (Sales, Marketing, Product) in defining a new enterprise ICP?",
          ],
        },
        {
          id: "sec2",
          analysis_persona: "consultant",
          start_time: "05:27",
          end_time: "11:05",
          section_title: "Operational Chaos & Competitive Threats",
          executive_summary: {
            text: "The client's current sales infrastructure, methodology, and team capabilities are fundamentally misaligned with the demands of complex enterprise deals, leading to significant pipeline visibility issues, lost opportunities, and declining sales force morale.",
            highlightId: "arg-wrapper",
          },
          client_pain_points: [
            {
              text: "Ineffective SDR-AE handoff due to lack of standardized Salesforce fields and cryptic notes.",
              highlightId: "pain-handoff-fail",
            },
            {
              text: "Salesforce instance is a 'disaster zone' with duplicate records, incomplete data, and inconsistent AE updates, leading to 'shadow CRMs'.",
              highlightId: "quote-sf-disaster",
            },
            {
              text: "Zero visibility into the sales pipeline and inability to generate reliable forecasts.",
              highlightId: "pain-no-visibility",
            },
            {
              text: "Lack of a standardized sales methodology (e.g., MEDDIC, Challenger Sale) leading to inconsistent deal execution and review.",
              highlightId: "pain-no-methodology",
            },
            {
              text: "Massive pipeline inflation due to undefined qualification criteria and 'gut feel' deal progression.",
              highlightId: "pain-gut-feel",
            },
            {
              text: "Top performers from mid-market struggling with long enterprise sales cycles, leading to frustration and attrition.",
              highlightId: "pain-reps-leaving",
            },
            {
              text: "Consistent loss of enterprise deals to competitors (primarily SynthCorp) due to superior go-to-market strategy.",
              highlightId: "pain-losing-to-gtm",
            },
            {
              text: "Low team morale and feeling of being 'set up to fail'.",
              highlightId: "pain-low-morale",
            },
          ],
          strategic_opportunities: [
            {
              text: "Overhaul and standardize the Salesforce instance to improve data quality, visibility, and AE efficiency.",
              highlightId: "quote-sf-disaster",
            },
            {
              text: "Implement and formally adopt a standardized sales methodology with comprehensive training and reinforcement.",
              highlightId: "entity-meddic",
            },
            {
              text: "Develop and implement clear qualification criteria and common language for deal reviews across sales stages.",
              highlightId: "pain-gut-feel",
            },
            {
              text: "Design and deliver targeted training programs to upskill AEs in enterprise sales competencies (e.g., financial acumen, stakeholder mapping, value selling).",
              highlightId: "pain-skill-gap",
            },
            {
              text: "Explore building out dedicated sales support functions (e.g., sales engineers, value consultants) to enhance deal support.",
              highlightId: "pain-losing-to-gtm",
            },
          ],
          critical_quotes: [
            {
              text: "\"For a company called 'DataWeave Analytics,' it’s incredibly ironic that our own sales data is a black box. We're flying blind, trying to land a 747 with the instruments from a Cessna.\"",
              highlightId: "quote-black-box",
            },
            {
              text: '"My top performers from the mid-market days are struggling the most... I\'ve had two of my best reps leave in the last six months for jobs at companies that have a more transactional model."',
              highlightId: "pain-reps-leaving",
            },
            {
              text: "\"We show up with a standard demo. It's like we're bringing a knife to a gunfight.\"",
              highlightId: "quote-knife-gunfight",
            },
          ],
          open_questions: [
            "What specific data fields and processes need to be standardized in Salesforce to create a single source of truth for pipeline data?",
            "Which sales methodology (e.g., MEDDIC, Challenger) is the best fit for the company's product and target enterprise market?",
            "What is the estimated financial impact of losing two top-performing reps in the last six months?",
          ],
        },
        {
          id: "sec3",
          analysis_persona: "consultant",
          start_time: "11:15",
          end_time: "17:24",
          section_title: "Enablement Deficiencies & Core Strengths",
          executive_summary: {
            text: "Despite a world-class product and committed board budget, the client's D-grade sales process, critical data visibility gaps, and ineffective sales enablement are severely hindering enterprise growth and preventing informed strategic decision-making.",
            highlightId: "quote-d-grade",
          },
          client_pain_points: [
            {
              text: "Operating with a 'D-grade' sales process, leading to lost deals despite a superior product.",
              highlightId: "quote-d-grade",
            },
            {
              text: "Inability to track critical sales performance metrics (e.g., pipeline velocity, CAC by segment, win-rates).",
              highlightId: "pain-no-metrics",
            },
            {
              text: "Reliance on 'useless, vanity metrics' (e.g., number of calls, emails sent).",
              highlightId: "pain-vanity-metrics",
            },
            {
              text: "Making multi-million dollar decisions based on 'anecdotes and gut feel' due to lack of reliable data.",
              highlightId: "quote-gut-feel",
            },
            {
              text: "Onboarding focused almost entirely on product knowledge, lacking essential business acumen and selling skills.",
              highlightId: "pain-product-onboarding",
            },
            {
              text: "No ongoing sales training, reinforcement, or effective change management post-training.",
              highlightId: "pain-no-training",
            },
            {
              text: "Frontline sales managers are 'glorified deal-chasers' and lack coaching skills, perpetuating team skill gaps.",
              highlightId: "pain-managers-not-coaches",
            },
          ],
          strategic_opportunities: [
            {
              text: "Implement a robust, A-grade sales process to capitalize on product strength.",
              highlightId: "quote-d-grade",
            },
            {
              text: "Establish comprehensive sales performance metric tracking and reporting within Salesforce.",
              highlightId: "pain-no-metrics",
            },
            {
              text: "Develop targeted sales enablement programs, including skills-based onboarding and ongoing training with reinforcement.",
              highlightId: "pain-no-training",
            },
            {
              text: "Train and empower frontline managers to become effective sales coaches.",
              highlightId: "quote-classic-mistake",
            },
            {
              text: "Leverage the strong product (NPS > 60) and low mid-market churn as foundational assets.",
              highlightId: "strength-product",
            },
            {
              text: "Effectively deploy the committed board budget to address systemic sales challenges.",
              highlightId: "strength-budget",
            },
          ],
          critical_quotes: [
            {
              text: '"A great product with a C-grade sales process will lose to a B-grade product with an A-grade sales process every single time. And right now, we\'re operating with a D-grade process."',
              highlightId: "quote-d-grade",
            },
            {
              text: '"I\'m making multi-million dollar decisions based on anecdotes and gut feel."',
              highlightId: "quote-gut-feel",
            },
            {
              text: '"We promoted our best players to be coaches, without ever teaching them how to coach. It\'s the classic mistake."',
              highlightId: "quote-classic-mistake",
            },
          ],
          open_questions: [
            "What are the top 3-5 non-vanity metrics that should be prioritized for tracking to get an accurate view of sales health?",
            "What specific coaching frameworks would be most effective for upskilling the current frontline managers?",
            "How can the board's committed budget be best allocated across process, technology, and people to achieve the highest ROI?",
          ],
        },
      ],
    },
    general: {
      argument_structure: {
        main_thesis:
          "The company's sales organization is failing to succeed in the enterprise market because its processes, technology, and team skills are still aligned with its past high-velocity mid-market model, rather than the complex, consultative approach required for enterprise sales, despite having a superior product.",
        supporting_arguments: [
          "The existing inbound-heavy lead generation and 'spray and pray' outbound efforts are ineffective for attracting and qualifying enterprise clients due to a lack of targeted strategy and tailored messaging.",
          "The outdated and dysfunctional Salesforce CRM prevents accurate pipeline visibility, reliable forecasting, and efficient lead handoffs, leading to disorganization and blind decision-making.",
          "The absence of a standardized sales methodology and process results in inconsistent deal qualification, inflated pipelines, and a lack of common language for managing complex enterprise sales cycles.",
          "The sales team, including frontline managers, possesses a significant skill gap, lacking the consultative selling abilities, business acumen, and patience required for long, multi-threaded enterprise deals.",
          "Competitors with inferior products are consistently winning enterprise deals by employing superior go-to-market strategies, including polished sales teams, robust sales engineering, and value consulting, which DataWeave Analytics lacks.",
        ],
        counterarguments_mentioned: [
          "The belief held by some internal stakeholders (engineers/product team) that the product's superior quality should be sufficient to win deals, which Mark refutes by emphasizing the critical role of the sales process.",
        ],
      },
      sections: [
        {
          id: "sec1",
          analysis_persona: "general",
          start_time: "00:00",
          end_time: "05:15",
          generated_title: "Enterprise Pivot: Sales Stagnation Challenges",
          "1_sentence_summary": {
            text: "A sales team, previously successful in the mid-market, is experiencing significant stagnation and underperformance after pivoting to the enterprise segment due to an inability to adapt its sales motion, lead generation, and team skills to the new, complex environment.",
            highlightId: "pain-brick-wall",
          },
          summary_points: [
            {
              text: "The company enjoyed three years of explosive 150% year-over-year growth in the mid-market with a transactional, inbound-driven sales model.",
              highlightId: "gen-s1-sum-1",
            },
            {
              text: "A strategic decision to move upmarket to the enterprise space has resulted in severe sales stagnation, with growth flattening to 10% year-over-year and softer forecasts.",
              highlightId: "gen-s1-sum-2",
            },
            {
              text: "The previous 'velocity game' sales motion is proving ineffective for the complex, multi-threaded enterprise sales requiring a consultative approach.",
              highlightId: "quote-consultative",
            },
            {
              text: "Current enterprise lead generation is failing due to an 'amateurish' outbound/ABM strategy and lack of a defined ICP or sales playbook.",
              highlightId: "pain-amateurish",
            },
            {
              text: "The conversion rate from cold outreach to qualified first meetings is abysmal, under 1%, indicating fundamental breakdowns in execution.",
              highlightId: "pain-abysmal-conversion",
            },
          ],
          actionable_advice: [
            {
              text: "Develop a clearly defined Ideal Customer Profile (ICP) specifically for the enterprise segment to guide targeting.",
              highlightId: "pain-no-icp",
            },
            {
              text: "Create a comprehensive sales playbook for outbound enterprise sales, including tailored value propositions for different buyer personas.",
              highlightId: "pain-no-playbook",
            },
            {
              text: "Train SDRs and AEs on consultative selling techniques, complex deal navigation, and building robust business cases.",
              highlightId: "quote-consultative",
            },
            {
              text: "Refine the Account-Based Marketing (ABM) strategy to ensure highly targeted, personalized outreach.",
              highlightId: "entity-abm",
            },
            {
              text: "Analyze the utilization of existing sales tools to ensure they are integrated into a structured enterprise sales process.",
              highlightId: "pain-amateurish",
            },
          ],
          notable_quotes: [
            {
              text: "The main challenge is stagnation.",
              highlightId: "quote-stagnation",
            },
            {
              text: "For three years, we were on a rocket ship.",
              highlightId: "gen-s1-sum-1",
            },
            {
              text: "It's a complex, multi-threaded sale that requires a consultative approach.",
              highlightId: "quote-consultative",
            },
            {
              text: "It’s a complete mess. Our inbound-heavy model doesn't work for landing a company like Johnson & Johnson.",
              highlightId: "quote-mess",
            },
          ],
          questions_and_answers: [
            {
              question:
                "What's the main challenge you're facing right now as the head of sales?",
              answer: {
                text: "The main challenge is stagnation. That's the word for it.",
                highlightId: "qa-s1-1",
              },
            },
            {
              question:
                "What did the sales motion look like in the 'good old days' of the mid-market?",
              answer: {
                text: "It was a velocity game. Pure and simple. We had a great inbound engine, thanks to marketing. An SDR would qualify them in a 15-minute call, and an Account Executive, an AE, would have the deal closed within 30 to 45 days. The average contract value, or ACV, was around $25,000. It was transactional.",
                highlightId: "qa-s1-2",
              },
            },
            {
              question:
                "What does the ideal enterprise sales motion look like in your mind?",
              answer: {
                text: "The ACV isn't $25k, it's $250k, maybe even half a million. The sales cycle isn't 30 days, it's 9 to 12 months. You're not talking to a single IT manager; you're navigating a buying committee of six to ten people across legal, finance, security, and multiple business units. It's a complex, multi-threaded sale that requires a consultative approach.",
                highlightId: "qa-s1-3",
              },
            },
            {
              question: "How are you generating enterprise leads?",
              answer: {
                text: "It’s a mess, Sarah. It’s a complete mess. Our inbound-heavy model doesn't work for landing a company like Johnson & Johnson. We've tried to bolt on an outbound, Account-Based Marketing—or ABM—strategy, but it feels... amateurish.",
                highlightId: "qa-s1-4",
              },
            },
            {
              question:
                "What's your hypothesis on why the cold outreach conversion is under 1%?",
              answer: {
                text: "We don't have a defined Ideal Customer Profile, an ICP, for the enterprise segment. So the SDRs don't know who to target. We don't have a real sales playbook for outbound, so they don't know what to say. There's no value proposition tailored to a Chief Financial Officer versus a Chief Technology Officer.",
                highlightId: "qa-s1-5",
              },
            },
          ],
          key_entities: [
            {
              text: "Account-Based Marketing (ABM)",
              highlightId: "entity-abm",
            },
            {
              text: "Ideal Customer Profile (ICP)",
              highlightId: "pain-no-icp",
            },
          ],
        },
        {
          id: "sec2",
          analysis_persona: "general",
          start_time: "05:27",
          end_time: "11:05",
          generated_title: "Broken Processes and Competitive Gaps",
          "1_sentence_summary": {
            text: "Mark O'Connell details how DataWeave Analytics is struggling with enterprise sales due to a dysfunctional Salesforce CRM, lack of a standardized sales methodology, significant skill gaps in the sales team, and being consistently outmaneuvered by competitor SynthCorp.",
            highlightId: "arg-wrapper",
          },
          summary_points: [
            {
              text: "DataWeave's Salesforce CRM is a 'disaster zone' with no standardized fields, duplicate records, and incomplete data, leading to zero pipeline visibility.",
              highlightId: "quote-sf-disaster",
            },
            {
              text: "There is no standardized sales methodology or common language for deal reviews, resulting in inconsistent deal management and pipeline inflation.",
              highlightId: "pain-no-methodology",
            },
            {
              text: "The sales team has a significant skill gap, lacking expertise in business consulting, financial conversations, and champion building.",
              highlightId: "pain-skill-gap",
            },
            {
              text: "DataWeave consistently loses enterprise deals to competitor SynthCorp, who possesses a slicker go-to-market strategy and more polished salespeople.",
              highlightId: "pain-losing-to-gtm",
            },
            {
              text: "Systemic issues are causing low team morale, high turnover among top performers, and a feeling of being set up to fail.",
              highlightId: "pain-low-morale",
            },
          ],
          actionable_advice: [
            {
              text: "Overhaul the Salesforce CRM by standardizing fields, cleaning data, and ensuring consistent updates to improve visibility.",
              highlightId: "quote-sf-disaster",
            },
            {
              text: "Implement a formal, standardized sales methodology (e.g., MEDDIC, Challenger Sale) with comprehensive training.",
              highlightId: "entity-meddic",
            },
            {
              text: "Develop and enforce a common language and clear checklists for deal reviews and opportunity qualification stages.",
              highlightId: "pain-gut-feel",
            },
            {
              text: "Invest in targeted sales training to bridge skill gaps in business consulting, financial acumen (TCO), and competitive navigation.",
              highlightId: "pain-skill-gap",
            },
            {
              text: "Enhance the go-to-market strategy by developing customized ROI calculators and business cases to compete effectively.",
              highlightId: "entity-synthcorp",
            },
            {
              text: "Improve the lead handoff process from SDRs to AEs by standardizing information requirements.",
              highlightId: "pain-handoff-fail",
            },
          ],
          notable_quotes: [
            {
              text: '"our Salesforce instance is a disaster zone."',
              highlightId: "quote-sf-disaster",
            },
            {
              text: "\"For a company called 'DataWeave Analytics,' it’s incredibly ironic that our own sales data is a black box. We're flying blind...\"",
              highlightId: "quote-black-box",
            },
            {
              text: "\"It's like we're bringing a knife to a gunfight.\"",
              highlightId: "quote-knife-gunfight",
            },
            {
              text: "\"The challenge isn't the product, it's the entire commercial wrapper around the product...\"",
              highlightId: "arg-wrapper",
            },
          ],
          questions_and_answers: [
            {
              question:
                "Tell me more about the Salesforce issues. You said it's a disaster zone. What are the symptoms of that?",
              answer: {
                text: "It was set up five years ago for the high-velocity, simple sales model. It's never been overhauled. We have duplicate records everywhere. Data is incomplete. AEs don't update it consistently because it's so clunky. They all have their own 'shadow CRMs' in spreadsheets or personal notes. As a result, I have zero visibility into the pipeline.",
                highlightId: "qa-s2-1",
              },
            },
            {
              question:
                "When an AE is in the middle of a complex enterprise deal, what support do they have? Do they have a standardized process they're following?",
              answer: {
                text: "No. That's the other big gap. We have no standardized sales methodology. Some of my reps who came from other companies try to use what they know... but there's no formal adoption, no training, no reinforcement. So every single AE is running their deals differently.",
                highlightId: "qa-s2-2",
              },
            },
            {
              question: "And this is impacting your team's ability to close.",
              answer: {
                text: "It's crushing them. My top performers from the mid-market days are struggling the most... I've had two of my best reps leave in the last six months for jobs at companies that have a more transactional model. The team's morale is low. They feel like they're being set up to fail, and frankly, I don't blame them.",
                highlightId: "qa-s2-3",
              },
            },
            {
              question:
                "What's the delta between the skills your team has and the skills they need for this new enterprise motion?",
              answer: {
                text: "It's wide. They're great at demoing the product... But they're not business consultants. They don't know how to read a balance sheet or have a conversation with a VP of Finance about Total Cost of Ownership. They don't know how to build a champion internally. They don't know how to navigate competitive bake-offs.",
                highlightId: "qa-s2-4",
              },
            },
            {
              question:
                "You mentioned SynthCorp. Tell me about the competitive landscape. Who are you losing to most often in these enterprise deals?",
              answer: {
                text: "It's almost always SynthCorp. They're our boogeyman... Their product isn't even as good as ours!... But they win the deals. Their go-to-market is just... slicker. Their salespeople are polished. They have an army of sales engineers and value consultants... We show up with a standard demo.",
                highlightId: "qa-s2-5",
              },
            },
          ],
          key_entities: [
            { text: "Salesforce CRM", highlightId: "quote-sf-disaster" },
            {
              text: "DataWeave Analytics",
              highlightId: "quote-black-box",
            },
            { text: "SynthCorp", highlightId: "entity-synthcorp" },
            {
              text: "Sales Methodology (e.g. MEDDIC)",
              highlightId: "entity-meddic",
            },
          ],
        },
        {
          id: "sec3",
          analysis_persona: "general",
          start_time: "11:15",
          end_time: "17:24",
          generated_title: "Fixing a Broken Sales Machine",
          "1_sentence_summary": {
            text: "The company's excellent product is being undermined by a D-grade sales process, lacking critical data, training, and coaching, despite having a motivated team and executive support to fix these issues.",
            highlightId: "quote-d-grade",
          },
          summary_points: [
            {
              text: "A superior product is being undermined by a 'D-grade' sales process, leading to losses against competitors with better sales execution.",
              highlightId: "quote-d-grade",
            },
            {
              text: "The company lacks reliable performance metrics, forcing multi-million dollar decisions based on anecdotes and gut feel.",
              highlightId: "pain-no-metrics",
            },
            {
              text: "Sales enablement is severely deficient, with product-focused onboarding, no ongoing training, and managers acting as 'deal-chasers' not coaches.",
              highlightId: "pain-no-training",
            },
            {
              text: "Issues are systemic, stemming from promoting top performers to management without providing them with coaching skills.",
              highlightId: "quote-classic-mistake",
            },
            {
              text: "Company has significant strengths: an excellent product (NPS > 60), low churn, a motivated team, and board commitment with budget to fix problems.",
              highlightId: "strength-product",
            },
          ],
          actionable_advice: [
            {
              text: "Prioritize investment in improving the sales process and enablement over solely relying on product superiority.",
              highlightId: "quote-d-grade",
            },
            {
              text: "Implement robust systems to track key performance metrics like pipeline velocity, CAC, and win-rates.",
              highlightId: "pain-no-metrics",
            },
            {
              text: "Redesign sales onboarding and training to focus on consultative selling skills and understanding customer business pains.",
              highlightId: "quote-api-vs-pain",
            },
            {
              text: "Develop frontline sales managers into effective coaches by providing them with specific training on coaching methodologies.",
              highlightId: "quote-classic-mistake",
            },
            {
              text: "Leverage existing strengths (product, team, budget) to strategically deploy resources for sales transformation.",
              highlightId: "strength-budget",
            },
          ],
          notable_quotes: [
            {
              text: "A great product with a C-grade sales process will lose to a B-grade product with an A-grade sales process every single time.",
              highlightId: "quote-d-grade",
            },
            {
              text: "I'm making multi-million dollar decisions based on anecdotes and gut feel.",
              highlightId: "quote-gut-feel",
            },
            {
              text: "A new hire can tell you about every API endpoint... but they can't tell you the top three business pains of a Chief Marketing Officer.",
              highlightId: "quote-api-vs-pain",
            },
            {
              text: "We promoted our best players to be coaches, without ever teaching them how to coach. It's the classic mistake.",
              highlightId: "quote-classic-mistake",
            },
          ],
          questions_and_answers: [
            {
              question:
                "What is the primary challenge hindering the company's sales performance?",
              answer: {
                text: "A great product with a C-grade sales process will lose to a B-grade product with an A-grade sales process every single time. And right now, we're operating with a D-grade process.",
                highlightId: "qa-s3-1",
              },
            },
            {
              question:
                "What critical data points are missing for effective decision-making?",
              answer: {
                text: "What I need is performance metrics. I need to see my lead-to-opportunity conversion rate by source. I need to see my pipeline velocity—how long deals are sitting in each stage. I need to know my Customer Acquisition Cost—CAC—for an enterprise customer... I need to know our win-rate against competitors like SynthCorp. I can't see any of this reliably.",
                highlightId: "qa-s3-2",
              },
            },
            {
              question:
                "How is the current sales enablement program deficient?",
              answer: {
                text: "Onboarding is a two-week program focused almost entirely on product knowledge... We have no ongoing training. No reinforcement... Our managers are glorified deal-chasers. They're not coaches, because they were our best AEs from the old model.",
                highlightId: "qa-s3-3",
              },
            },
            {
              question:
                "What are the company's key strengths that can be leveraged for improvement?",
              answer: {
                text: "Our biggest asset, without a doubt, is the product. It truly is excellent and our customers who use it, love it. Our Net Promoter Score is over 60, which is world-class for B2B SaaS. Second, I do have a core group of people on the team who are hungry. They're frustrated, yes, but they're smart and they want to win. And third... well, we have the budget to fix this.",
                highlightId: "qa-s3-4",
              },
            },
          ],
          key_entities: [
            {
              text: "Performance Metrics (e.g., CAC, win-rate)",
              highlightId: "pain-no-metrics",
            },
            { text: "Sales Enablement", highlightId: "pain-no-training" },
            {
              text: "Net Promoter Score (NPS)",
              highlightId: "strength-product",
            },
          ],
        },
      ],
    },
  },
  engineering_team_employee_turnover: {
    general: {
      argument_structure: {
        main_thesis:
          "The high voluntary turnover in the engineering organization, though often attributed to compensation, is fundamentally driven by systemic issues including a lack of technical career progression, inadequate new hire onboarding, and an overstressed management team.",
        supporting_arguments: [
          "Senior engineers, who are the most valuable and tenured, are leaving because there is no formal technical career track beyond management, forcing them to seek growth elsewhere.",
          "New hires experience an ad-hoc onboarding process without structured mentorship, leading to feelings of disconnection and a lack of impact.",
          "Engineering managers are overburdened by aggressive deadlines, preventing them from providing sufficient career development and support to their teams.",
          "The company's growth has fostered a siloed 'feature factory' culture where engineers lack creative input and a sense of mission, contributing to disengagement.",
        ],
        counterarguments_mentioned: [
          "Exit interviews frequently cite compensation as the reason for departure, leading to an initial conclusion that the company is simply being outbid in the market.",
        ],
      },
      sections: [
        {
          id: "sec1",
          analysis_persona: "general",
          start_time: "00:00",
          end_time: "04:09",
          generated_title: "Engineering Retention: Beyond Compensation",
          "1_sentence_summary": {
            text: "While compensation is often cited, the engineering organization's retention issues stem from systemic problems including a lack of technical career growth paths for senior engineers, ad-hoc onboarding for new hires, and overworked managers, all contributing to a fading sense of mission.",
            highlightId: "gen-s1-summary",
          },
          summary_points: [
            {
              text: "Voluntary turnover in the engineering department is up 15% year-over-year, significantly above the company average, with compensation often cited as the official reason for departure.",
              highlightId: "gen-s1-sp-1",
            },
            {
              text: "The primary talent leaving are senior engineers (3-5 years tenure), not junior staff, due to a lack of a formal technical career track beyond management, forcing them to leave for promotion and pay bumps.",
              highlightId: "gen-s1-sp-2",
            },
            {
              text: "New hires experience ad-hoc onboarding without structured mentorship, leading to feelings of disconnection and a lack of impact, making them feel like a 'cog in the machine'.",
              highlightId: "gen-s1-sp-3",
            },
            {
              text: "Engineering Managers are overstretched, struggling to meet deadlines while also providing adequate support, mentorship, and career development to their direct reports.",
              highlightId: "gen-s1-sp-4",
            },
            {
              text: "The company culture has shifted from a collaborative, mission-driven 'founder' mentality to a siloed 'feature factory' where engineers feel disconnected from the 'why' of their work.",
              highlightId: "gen-s1-sp-5",
            },
          ],
          actionable_advice: [
            {
              text: "Develop and implement a formal technical career track (e.g., Principal Engineer) to provide growth opportunities for senior individual contributors.",
              highlightId: "gen-s1-aa-1",
            },
            {
              text: "Create a structured onboarding program for new hires that includes mentorship and helps them understand their impact and connection to the company's mission.",
              highlightId: "gen-s1-aa-2",
            },
            {
              text: "Address the workload and support systems for Engineering Managers to enable them to provide adequate 1-on-1s, performance reviews, and career development discussions.",
              highlightId: "gen-s1-aa-3",
            },
            {
              text: "Foster a culture that encourages collaboration and allows engineers creative input into project 'why,' moving beyond a 'feature factory' mentality.",
              highlightId: "gen-s1-aa-4",
            },
            {
              text: "Combine qualitative insights with HR data (promotion velocity, tenure, manager effectiveness scores) to build a data-backed case for executive recommendations.",
              highlightId: "gen-s1-aa-5",
            },
          ],
          notable_quotes: [
            {
              text: "It feels like every month I'm approving another backfill position for a good engineer who has decided to leave.",
              highlightId: "gen-s1-q-1",
            },
            {
              text: "We don't have a formal track for that. So when they hit that 'senior' ceiling, the only way to get a promotion and a significant pay bump is to leave for a company that has a mature technical track.",
              highlightId: "gen-s1-q-2",
            },
            {
              text: "So a senior engineer can't see a future, and a junior engineer can't see their impact. It sounds like two sides of the same coin.",
              highlightId: "gen-s1-q-3",
            },
            {
              text: "We aren't developing our talent; we're just using them until they burn out or get a better offer.",
              highlightId: "gen-s1-q-4",
            },
          ],
          questions_and_answers: [
            {
              question:
                "What is the official reason engineers give for leaving the company?",
              answer: {
                text: "The official reason is almost always the same: compensation. The exit interviews HR conducts are clear. A competitor offers them 20% more, and they're gone.",
                highlightId: "qa-s1-1",
              },
            },
            {
              question: "Which group of engineers is primarily leaving?",
              answer: {
                text: "it's not our junior engineers who are leaving. It's the senior ones. The people who have been here for three to five years, who are our most productive contributors.",
                highlightId: "qa-s1-2",
              },
            },
            {
              question:
                "What is the perceived root cause for senior engineers leaving, beyond compensation?",
              answer: {
                text: "I think it's about career growth. Or the lack thereof... We don't have a formal track for that. So when they hit that 'senior' ceiling, the only way to get a promotion...is to leave...",
                highlightId: "qa-s1-3",
              },
            },
            {
              question:
                "What are the issues with the onboarding process for new hires?",
              answer: {
                text: "Our onboarding is another weak point. It’s very ad‑hoc. We throw a new hire at a mountain of documentation... There’s no structured mentorship program.",
                highlightId: "qa-s1-4",
              },
            },
            {
              question: "How has the company culture evolved as it grew?",
              answer: {
                text: "When we were smaller, everyone felt like a founder. We were all in one room, the mission was clear, and collaboration was natural. Now, we're 300 people. We've become siloed.",
                highlightId: "qa-s1-5",
              },
            },
          ],
          key_entities: [],
        },
        {
          id: "sec2",
          analysis_persona: "general",
          start_time: "04:34",
          end_time: "10:30",
          generated_title: "Strategic HR and EngOps Alignment",
          "1_sentence_summary": {
            text: "David and Jessica discuss key performance indicators, career path development, communication strategies for organizational changes, and potential risks like budget and engineering capacity.",
            highlightId: "gen-s2-summary",
          },
          summary_points: [
            {
              text: "Key Performance Indicators (KPIs) for tracking improvements include retention by hire cohort, promotion velocity, manager effectiveness scores, new-hire ramp time, and engineer engagement scores.",
              highlightId: "gen-s2-sp-1",
            },
            {
              text: "Specific targets are set: reduce senior voluntary turnover by 5 percentage points in six months, and improve new-hire 90-day retention by 10 percent.",
              highlightId: "gen-s2-sp-2",
            },
            {
              text: "Career paths will be developed with proposed technical track levels from IC-1 through IC-5, designating Principal Engineer at IC-4 and Distinguished Engineering at IC-5.",
              highlightId: "gen-s2-sp-3",
            },
            {
              text: "Communication strategies for these changes involve a town hall announcement, updated career framework documentation in Confluence, and follow-up 1:1 discussions with managers and their teams.",
              highlightId: "gen-s2-sp-4",
            },
            {
              text: "Potential risks identified include the need for budget approval for external coaching and career-framework workshops, and tight engineering capacity requiring reprioritization of non-critical work.",
              highlightId: "gen-s2-sp-5",
            },
          ],
          actionable_advice: [
            {
              text: "Define specific, measurable KPIs (e.g., retention, promotion velocity, engagement scores) to monitor progress.",
              highlightId: "gen-s2-aa-1",
            },
            {
              text: "Set clear, quantifiable targets for improvement (e.g., reduce turnover by X%, improve retention by Y%).",
              highlightId: "gen-s2-aa-2",
            },
            {
              text: "Develop structured career paths with defined levels and roles (e.g., IC-1 to IC-5, Principal Engineer, Distinguished Engineering).",
              highlightId: "gen-s2-aa-3",
            },
            {
              text: "Involve relevant stakeholders (HR, senior engineers) early to ensure buy-in for new initiatives.",
              highlightId: "gen-s2-aa-4",
            },
            {
              text: "Plan a multi-channel communication strategy for changes, including broad announcements (town halls), detailed documentation (Confluence), and personalized discussions (1:1s).",
              highlightId: "gen-s2-aa-5",
            },
            {
              text: "Proactively identify potential risks (e.g., budget constraints, resource limitations) and develop mitigation plans.",
              highlightId: "gen-s2-aa-6",
            },
            {
              text: "Align with other departments (e.g., Product) to reprioritize work if engineering capacity is tight.",
              highlightId: "gen-s2-aa-7",
            },
          ],
          notable_quotes: [
            {
              text: "We could track retention by hire cohort at 3-, 6-, and 12‑month intervals, promotion velocity for IC and manager tracks, and manager effectiveness scores from our engagement survey.",
              highlightId: "gen-s2-q-1",
            },
            {
              text: "Prototype in two weeks, then iterate monthly based on feedback.",
              highlightId: "gen-s2-q-2",
            },
            {
              text: "We might need budget approval for external coaching and career‑framework workshops.",
              highlightId: "gen-s2-q-3",
            },
            {
              text: "Also, engineering capacity is tight; we may need to reprioritize a sprint or two to free up time.",
              highlightId: "gen-s2-q-4",
            },
          ],
          questions_and_answers: [
            {
              question: "What KPIs should be defined to monitor progress?",
              answer: {
                text: "We could track retention by hire cohort at 3-, 6-, and 12‑month intervals, promotion velocity for IC and manager tracks, and manager effectiveness scores from our engagement survey.",
                highlightId: "qa-s2-1",
              },
            },
            {
              question:
                "Who will own the dashboard for tracking these metrics?",
              answer: {
                text: "We can have EngOps build the initial dashboard and HR can maintain and refine it.",
                highlightId: "qa-s2-2",
              },
            },
            {
              question: "What is the timeline for the dashboard prototype?",
              answer: {
                text: "Prototype in two weeks, then iterate monthly based on feedback.",
                highlightId: "qa-s2-3",
              },
            },
            {
              question:
                "How many levels are proposed for the technical track career paths?",
              answer: {
                text: "Perhaps IC‑1 through IC‑5, with principal engineer at IC‑4 and distinguished engineering at IC‑5.",
                highlightId: "qa-s2-4",
              },
            },
            {
              question: "How will these changes be socialized?",
              answer: {
                text: "Town hall announcement, updated career framework docs in Confluence, and follow‑up 1:1 discussions with each manager and their teams.",
                highlightId: "qa-s2-5",
              },
            },
            {
              question: "What are the potential risks or dependencies?",
              answer: {
                text: "We might need budget approval for external coaching and career‑framework workshops. Also, engineering capacity is tight; we may need to reprioritize a sprint or two to free up time.",
                highlightId: "qa-s2-6",
              },
            },
          ],
          key_entities: [],
        },
      ],
    },
    consultant: {
      synthesis_results: {
        overarching_themes: [
          "Systemic Talent Attrition & Retention Crisis: The core problem is the loss of senior engineering talent due to a lack of structured career progression and inadequate support systems, not merely compensation.",
          "The Criticality of Structured Career Development: The absence of clear technical career paths forces valuable individual contributors into unsuitable management roles or out of the company, highlighting a fundamental flaw in talent management.",
          "Operationalizing Strategic Initiatives Under Constraint: While the root causes are identified and solutions proposed, the practical implementation is immediately challenged by significant budget and engineering capacity limitations, creating a critical resource allocation dilemma.",
          "Shift from Reactive Problem-Solving to Proactive Talent Strategy: The document outlines a move from merely reacting to high turnover to establishing a data-driven, structured approach to talent development, retention, and organizational health.",
        ],
        unifying_insights: [
          "The 'Cost of Doing Nothing' vs. 'Cost of Doing Something' Dilemma: The document implicitly highlights that the current high attrition (the cost of doing nothing) is significantly impacting project roadmaps and institutional knowledge, yet the proposed solutions (the cost of doing something) demand immediate and potentially painful reprioritization of budget and engineering capacity. The strategic imperative is to quantify and compare these costs to justify the necessary investment.",
          "Beyond HR: A Cross-Functional Strategic Imperative: While talent retention is often perceived as an HR function, the analysis reveals it's deeply intertwined with Engineering operations (capacity, roadmaps), Product collaboration (feature factory), and overall organizational culture. Addressing this requires a unified, cross-functional leadership commitment and integrated solutions, not just isolated departmental initiatives.",
          "The Paradox of Senior Talent: The company is losing its most productive senior engineers precisely because it lacks a formal path for them to *remain* senior individual contributors, effectively forcing them out or into unsuitable management roles. This reveals a fundamental misunderstanding of how to nurture, retain, and leverage high-value technical expertise within the organization.",
        ],
        key_contradictions: [
          {
            analysis:
              "While the analysis correctly identifies that the root causes of attrition are systemic and not purely financial, the proposed solutions to these systemic problems are themselves heavily constrained by budget and engineering capacity. This highlights a critical tension: the strategic imperative to address deep-seated issues clashes with the practical operational realities of resource scarcity, implying that even 'non-monetary' solutions carry significant financial and capacity costs that must be proactively managed and justified.",
            point_a:
              "The core drivers of engineering talent attrition are systemic issues related to a lack of technical career progression, inadequate new hire onboarding, and overburdened management. 'It's not one single thing we can fix with money. It's a systemic problem with our career framework and our internal support systems.'",
            point_b:
              "The implementation of solutions to these systemic issues faces immediate and critical constraints: 'We might need budget approval for external coaching and career-framework workshops.' and 'engineering capacity is tight; we may need to reprioritize a sprint or two to free up time.'",
          },
        ],
        narrative_arc:
          "The core story of the document centers on a critical engineering talent attrition problem, specifically the loss of highly productive senior engineers. This problem isn't driven by compensation as initially perceived, but by a cascade of systemic issues: a missing formal technical career ladder, overburdened engineering managers, weak new-hire onboarding, and a siloed 'feature factory' mentality that stifles creative input. The key turning point is the realization that these are deeply embedded systemic flaws in the career framework and internal support systems, demanding a fundamental shift in talent strategy. The ultimate strategic choice is to proactively design and implement comprehensive solutions like formal technical career paths and improved onboarding, but this hinges on the immediate and deliberate resolution of critical budget and engineering capacity constraints.",
      },
      sections: [
        {
          id: "sec1",
          analysis_persona: "consultant",
          start_time: "00:00",
          end_time: "04:09",
          section_title: "Engineering Talent Retention Analysis",
          executive_summary: {
            text: "Despite compensation being the stated reason for departure, the core drivers of engineering talent attrition are systemic issues related to a lack of technical career progression, inadequate new hire onboarding, and overburdened management.",
            highlightId: "consultant-s1-summary",
          },
          client_pain_points: [
            {
              text: "15% year-over-year voluntary turnover in the engineering department, well above company average.",
              highlightId: "consultant-s1-pain-1",
            },
            {
              text: "Loss of senior engineers (3-5 years tenure), who are the most productive contributors and project leaders.",
              highlightId: "consultant-s1-pain-2",
            },
            {
              text: "Ad-hoc and weak onboarding process for new hires, leading to feelings of disconnection and lack of impact.",
              highlightId: "consultant-s1-pain-3",
            },
            {
              text: "Engineering Managers are spread too thin, struggling to balance deadlines with mentorship and career development.",
              highlightId: "consultant-s1-pain-4",
            },
            {
              text: "Siloed departments, leading to engineers feeling like a 'feature factory' without creative input.",
              highlightId: "consultant-s1-pain-5",
            },
          ],
          strategic_opportunities: [
            {
              text: "Develop and implement a formal technical career track for individual contributors (e.g., Principal Engineer).",
              highlightId: "consultant-s1-opp-1",
            },
            {
              text: "Design and implement a structured mentorship program for new hires.",
              highlightId: "consultant-s1-opp-2",
            },
            {
              text: "Address Engineering Manager workload and bandwidth issues to enable better talent development.",
              highlightId: "consultant-s1-opp-3",
            },
            {
              text: "Leverage HR data (promotion velocity, tenure, manager effectiveness scores) to build a data-backed case.",
              highlightId: "consultant-s1-opp-4",
            },
          ],
          critical_quotes: [
            {
              text: "It's not our junior engineers who are leaving. It's the senior ones. The people who have been here for three to five years, who are our most productive contributors.",
              highlightId: "consultant-s1-quote-1",
            },
            {
              text: "We don't have a formal track for that. So when they hit that 'senior' ceiling, the only way to get a promotion and a significant pay bump is to leave for a company that has a mature technical track.",
              highlightId: "consultant-s1-quote-2",
            },
            {
              text: "It's not one single thing we can fix with money. It's a systemic problem with our career framework and our internal support systems.",
              highlightId: "consultant-s1-quote-3",
            },
          ],
          open_questions: [
            "What is the estimated total cost of backfilling a senior engineer, including lost productivity, recruitment expenses, and institutional knowledge drain?",
            "How can the impact of the 'feature factory' culture on engineer engagement and innovation be quantitatively measured?",
            "Which specific changes to the onboarding process would have the highest impact on a new hire's sense of belonging and effectiveness in their first 90 days?",
          ],
        },
        {
          id: "sec2",
          analysis_persona: "consultant",
          start_time: "04:34",
          end_time: "10:30",
          section_title: "Execution & Risk Planning",
          executive_summary: {
            text: "The client has established clear metrics, ownership, and communication strategies for talent initiatives, but critical budget and engineering capacity constraints require immediate, proactive resolution.",
            highlightId: "consultant-s2-summary",
          },
          client_pain_points: [
            {
              text: "Need for budget approval for external coaching and career-framework workshops.",
              highlightId: "consultant-s2-pain-1",
            },
            {
              text: "Tight engineering capacity requiring reprioritization of current work.",
              highlightId: "consultant-s2-pain-2",
            },
          ],
          strategic_opportunities: [
            {
              text: "Define and track key performance indicators (KPIs) for talent management (retention, promotion velocity, manager effectiveness, etc.).",
              highlightId: "consultant-s2-opp-1",
            },
            {
              text: "Develop a structured technical career path with defined levels (IC-1 to IC-5, including Principal and Distinguished Engineer).",
              highlightId: "consultant-s2-opp-2",
            },
            {
              text: "Implement a multi-channel communication strategy for organizational changes (Town hall, Confluence, 1:1s).",
              highlightId: "consultant-s2-opp-3",
            },
            {
              text: "Proactively identify and address critical dependencies, including budget and engineering capacity.",
              highlightId: "consultant-s2-opp-4",
            },
          ],
          critical_quotes: [
            {
              text: "reduce senior voluntary turnover by 5 percentage points in six months, and improve new-hire 90-day retention by 10 percent.",
              highlightId: "consultant-s2-quote-1",
            },
            {
              text: "We might need budget approval for external coaching and career-framework workshops.",
              highlightId: "consultant-s2-quote-2",
            },
            {
              text: "engineering capacity is tight; we may need to reprioritize a sprint or two to free up time.",
              highlightId: "consultant-s2-quote-3",
            },
          ],
          open_questions: [
            "What is the specific budget required for external coaching and workshops, and what is the expected ROI in terms of retention and engagement?",
            "Which non-critical projects can be deprioritized to free up engineering capacity, and what is the business impact of that decision?",
            "How will the effectiveness of the new communication strategy for the career framework be measured and iterated upon?",
          ],
        },
      ],
    },
  },
};
