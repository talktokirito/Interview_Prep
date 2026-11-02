// Each entry: [interview summary, meaning, motivation, context, what not to say, how to answer, nuance, other angles, sample answer]
// The sample answers are generic illustrations: adapt them to your own real stories and numbers.
const SECTION_LABELS = ["Meaning (What they are really asking)", "Motivation (Why they ask)", "Context (When it comes up)", "Anti-Context (What NOT to say)", "Implementation (How to answer, STAR)", "Trade-offs (Nuance)", "Alternatives (Other angles)", "Sample answer"];
const SERVICE_ANSWERS = {
  "The STAR Method": [
    "STAR structures a behavioural answer as Situation, Task, Action and Result. Spend the most time on your own actions and finish with a measurable result and what you learned, so the interviewer hears evidence rather than opinion.",
    "They want a concrete, specific past example rather than a hypothetical or a general philosophy. Situation and Task set the context briefly, Action is what you personally did, and Result is the outcome with evidence.",
    "Past behaviour is the best predictor of future behaviour, and a structured story lets the interviewer score you consistently against the same criteria as other candidates.",
    "It applies to almost every behavioural question: conflict, failure, leadership, deadlines, mentoring and incidents. Prepare six to eight stories that can be reshaped for different questions.",
    "Do not ramble through ten minutes of background, say we throughout so your role is unclear, describe what you would do instead of what you did, or end without a result.",
    "Aim for about two minutes: roughly 15 percent Situation and Task, 60 percent Action, 25 percent Result and reflection. Use I for your decisions, quantify the result (latency, cost, defects, time), and close with what you would do differently.",
    "STAR can sound mechanical if recited, so tell it as a natural story with the structure underneath. For senior roles add a fifth beat, Learning, because reflection signals maturity. Do not invent numbers you cannot defend under follow-up questions.",
    "Variants are CAR (Context, Action, Result) for shorter answers, and SOAR or STARL, which add Obstacle or Learning. Use whichever keeps the story short and outcome-focused.",
    `Situation: Our checkout service had a p99 latency of 4 seconds during sales events, and customer drop-off was rising.
Task: I was the tech lead and had two weeks to bring it under one second before the next campaign.
Action: I profiled with a flame graph and found one N+1 query pattern and a synchronous call to a slow third-party service. I fixed the query with a batch fetch, moved the third-party call behind a timeout with a cached fallback, and added a load test to our pipeline. I walked two teammates through the findings so the fix was owned by the team, not just me.
Result: p99 dropped from 4 seconds to 700 milliseconds, the campaign ran without incidents, and the load test caught a similar regression a month later.
Learning: I would add latency budgets earlier in design so the problem does not first appear in production.`
  ],
  "Tell Me About Yourself": [
    "Give a focused 90-second professional narrative: where you are now, the key experience that got you here, and why this role is the logical next step. Think present, past, future, with the strongest evidence for this specific job at the centre.",
    "They are not asking for your life story. They want to know who you are as an engineer, what you are proud of, and whether your direction fits the role and the team.",
    "It sets the tone, gives them hooks for follow-up questions, and shows how well you communicate and prioritise, which matters for a senior person who will brief stakeholders.",
    "It is almost always the first question, in recruiter screens, hiring manager rounds and panel interviews, sometimes phrased as walk me through your CV.",
    "Do not recite your CV chronologically, share personal or irrelevant background, criticise a previous employer, or speak for five minutes without a clear point.",
    "Structure it as present (current role and scope), past (two or three milestones that show growth and impact, with one number), future (what you want to do next and why this company). Rehearse it aloud, and tailor the closing line to the job description.",
    "Seniority means emphasising impact, scope and leadership over a list of technologies. Keep it open-ended so the interviewer can pick a thread, rather than burying every detail in the answer.",
    "Alternatives are a theme-based opening (I build reliable backend platforms and grow teams), or a story-led opening around one defining project. Both are fine if they stay short.",
    `I am a backend engineer with about ten years of experience, and for the last four I have been a senior engineer leading a team of six on a payments platform built with Java and Spring Boot. Early in my career I worked on large monolithic systems, which taught me how much operability and clean boundaries matter. Over the past few years I led the move of our order and billing flows to event-driven services, which cut the release cycle from monthly to several times a week and reduced production incidents by roughly a third. I enjoy the mix of hands-on design, mentoring and working with product to shape what we build. I am now looking for a role with a wider architectural scope on a platform at larger scale, and this position appeals because it combines deep technical ownership with leading engineers, which is where I do my best work.`
  ],
  "Why Are You Leaving": [
    "Give a positive, forward-looking reason about what you are moving toward: scope, scale, technical challenge or growth. Stay factual and respectful about your current employer, and make sure the reason connects to what this role offers.",
    "They are testing your judgement, professionalism and motivation, and trying to spot red flags: conflict, poor performance, or a pattern of leaving after short periods.",
    "A reason that is vague or bitter suggests the same problem will repeat at their company, and they want to know whether this role will actually keep you.",
    "It comes up in recruiter and hiring manager rounds, and again when there are gaps or short tenures in your CV, or when you are leaving a well-known company.",
    "Do not badmouth your manager or colleagues, blame the company, lead with money, or give an answer that the new role cannot fix. Do not lie about a layoff or dismissal either.",
    "Choose one honest, positive reason (I have learned what this role can teach, and I want broader architectural scope), support it with a brief fact, and pivot at once to why this company is the right next step. Keep it under 45 seconds.",
    "If you were laid off, say so plainly and briefly, then move to what you achieved and what you want. If the real reason is a difficult culture, translate it into what you are looking for rather than what you are escaping.",
    "Angles by situation: growth ceiling (the next step needs a move), company change (reorganisation or strategy shift), domain interest, or career break. Always finish with what you are moving toward.",
    `I have been at my current company for six years and I am proud of what the team and I built, including moving our core platform to a more resilient architecture. Over the last year I realised the main architectural decisions there are mostly made, and my role has become maintaining and incrementally improving rather than shaping new systems. I want a position where I can take on a broader technical scope, work with systems at greater scale and help grow engineers. This role stood out because it asks for exactly that: owning architecture for a platform that is still evolving, and mentoring a team. I have left on good terms, I am working a full notice period to hand over properly, and I would like to bring that experience to a new set of problems. Before deciding, I talked to my manager about wider scope internally, and we agreed that the opportunities were limited in the short term, so this is a considered move rather than a reaction.`
  ],
  "Strengths and Weaknesses": [
    "Choose two or three genuine strengths that are relevant to the role and back each with a short example. For the weakness, pick a real, non-critical one that you are actively working on, and describe the steps and progress you have made.",
    "They are testing self-awareness, honesty and your ability to improve. A senior engineer should know their gaps and manage them rather than pretending they have none.",
    "It helps them judge fit against the role's real needs, and how you receive feedback, which predicts how you will work in a team.",
    "It appears in most screening and manager interviews, often right after the introduction, and again as what would your manager say about you.",
    "Do not give a fake weakness such as I work too hard or I am a perfectionist, name a disqualifying weakness for the role, or list strengths with no evidence. Do not claim to have no weaknesses.",
    "For strengths: name the skill, give a one-line proof with an outcome. For weakness: name it plainly, say how it showed up, state two concrete actions you have taken (a habit, tool or mentor), and report the improvement.",
    "A weakness should be real but not central: a senior backend engineer saying they struggle with code quality would hurt, while saying they used to take on too much delegable work is credible. Avoid framing it as a disguised strength.",
    "Other angles are using peer or manager feedback as a source (my last review said...), or contrasting what you are strong at with what you deliberately partner with others to cover.",
    `My main strengths are system design and communication. For example, I break down ambiguous requirements into clear designs and then explain the trade-offs to non-technical stakeholders, which helped us agree on a phased rollout of a new billing flow without rework. A second strength is mentoring, and two engineers I coached were promoted within two years.

My weakness is that I tend to take on hard problems myself instead of delegating them, because it feels faster. About a year ago that left me as a bottleneck on two critical reviews. I now pair with a teammate on any task I would normally keep, I set a rule that I do not own more than one critical path item at a time, and I ask for feedback in our one-to-ones. Since then my team has been shipping more independently, and my review turnaround time has fallen from two days to under one. It is something I still watch for, but it is in a much better place.`
  ],
  "Technical Decisions and Trade-offs": [
    "Describe a significant decision where you compared real options, made the trade-offs explicit, decided with the data you had, and handled the consequences. They want to see structured reasoning, stakeholder alignment and honesty about what you gave up.",
    "They ask how you think, not just what you chose: which criteria you used, who you involved, how you handled uncertainty and how you recorded the decision.",
    "Senior engineers are paid for decisions that are expensive to reverse. Interviewers need confidence that you avoid both hype-driven choices and analysis paralysis.",
    "It appears in design and leadership rounds, often as tell me about a time you chose a technology or architecture, or a time you changed your mind.",
    "Do not say the best technology obviously won, hide the downsides, present a decision you made alone without consultation, or pick a trivial example with no real alternatives.",
    "Situation and constraints first, then two or three options with criteria (cost, risk, team skills, time), a quick experiment or proof of concept, the decision, the ADR you wrote, and the measured outcome. Name the trade-off you consciously accepted.",
    "Show reversibility thinking: separate one-way from two-way decisions and spend effort accordingly. Mention what you would change in hindsight, because few decisions are perfect.",
    "Other angles are a decision you reversed, a decision to not adopt something fashionable, or a build-versus-buy choice. All demonstrate judgement.",
    `Situation: Our order service needed to publish events to three downstream teams, and we had to choose between RabbitMQ and Kafka. Traffic was about 3,000 events per second at peak and teams wanted replay for new consumers.
Task: As the senior engineer, I had to recommend an option within three weeks without disrupting the roadmap.
Action: I listed the criteria with the team: replay, throughput, operational cost and team skills. I ran a one-week spike with both, measured throughput and failure handling, and talked to the platform team about operating costs. Kafka won on replay and throughput, but the team had no operational experience, so I recorded the decision in an ADR, proposed a managed offering, and scheduled training. I also defined a revisit trigger.
Result: We launched in six weeks, onboarded two new consumers by replaying history, and we spent about 20 percent more on infrastructure than RabbitMQ would have cost, a trade-off we accepted knowingly.`
  ],
  "Mentoring Junior Engineers": [
    "Show that you grow people deliberately: you set expectations, give context rather than answers, offer timely and specific feedback, and measure success by their independence. Back it with one concrete story of someone who progressed.",
    "They are asking whether you multiply your impact through others, and whether you can coach different personalities without doing the work for them.",
    "Senior and lead roles are judged on team output, not individual output. Poor mentoring leads to bottlenecks, attrition and inconsistent quality.",
    "It comes up for senior, staff and lead positions, and whenever the role includes onboarding, code review ownership or a team lead function.",
    "Do not say you just let them figure it out, that you fix their code yourself because it is faster, or that mentoring takes too much time. Do not take credit for their work either.",
    "Describe how you diagnosed their starting point, agreed goals, used pairing, stretch tasks and structured code review, adjusted your style (guiding then stepping back), and what changed for them in measurable terms such as ownership of a feature or promotion.",
    "Balance support with autonomy: too much help creates dependence, too little causes failure. Mentoring takes time away from your own delivery, so be honest about how you protected both.",
    "Other angles are mentoring a struggling engineer, onboarding new joiners, running internal learning sessions, or being mentored yourself and what you learned from it.",
    `Situation: A junior engineer joined our team and struggled with design decisions; her pull requests worked but needed heavy rework, and she was losing confidence.
Task: I was asked to help her reach independent delivery within six months.
Action: We agreed three goals in our first one-to-one: write testable code, design small features alone and present a design. I paired with her twice a week at first, then switched to asking questions in reviews instead of giving fixes. I gave her a small feature to own end to end, including a one-page design that I reviewed but did not rewrite. I praised specific improvements and was direct about gaps, and I asked her what support she needed.
Result: Within five months her review rework dropped by about half, she delivered a feature independently, and she later presented our design at a team demo. She now mentors new joiners herself, which for me was the best outcome.`
  ],
  "Leading Without Authority": [
    "Show that you influence outcomes through credibility, clear communication and aligned incentives rather than through a title: you build a case with data, involve stakeholders early, make the benefit visible to others and follow through. Give an example where people changed course because of your approach.",
    "They are asking how you get things done across teams or with peers when you cannot give orders, which is the daily reality of senior and staff engineers.",
    "Cross-team change such as standards, migrations and platform choices depends on persuasion. Engineers who can only lead with authority do not scale beyond their team.",
    "It comes up in questions about driving adoption, cross-team initiatives, introducing a new practice, or convincing a sceptical group.",
    "Do not describe escalating to your manager to force compliance, pushing a solution without listening, or taking over other people's work. Do not claim sole credit for a group result.",
    "Start with the shared problem and its cost, listen to objections, find allies, pilot a small proof, share results transparently, make adoption easy (templates, tooling), give credit generously and follow up. State the outcome in adoption or impact terms.",
    "Influence takes time and may not succeed every time. Be ready to say what you did when someone still disagreed, such as committing to the group decision or escalating with the facts as a last resort.",
    "Other angles are leading a guild or working group, running a design review process, or driving a migration across several teams.",
    `Situation: Several teams were producing logs in different formats, which made incident investigation slow, and no one owned a standard.
Task: I wanted to introduce structured logging with correlation IDs across eight services, but I had no authority over the other teams.
Action: I measured how long it took to trace a request in our last three incidents, around 50 minutes on average, and shared that with the team leads. I built a small library and a starter template, piloted it in my own service, and showed a trace across two services in a demo. I offered to pair on the first integration for each team, listened to concerns about performance and adjusted the library, and put a short adoption guide in the shared docs.
Result: Within three months seven of eight services adopted it voluntarily, and the average time to trace a request in incidents fell to about 15 minutes. The remaining team joined after their next incident.`
  ],
  "Handling Technical Debt": [
    "Show that you treat debt as a business trade-off: you make it visible, quantify its cost in delivery terms, negotiate capacity for it with product, and fix the debt with the highest interest first. A good story shows both a pragmatic shortcut and a disciplined pay-down.",
    "They want to know whether you can balance delivery pressure with long-term health, and whether you can argue for refactoring in business language rather than as a personal preference.",
    "Unmanaged debt slows teams over time, but engineers who refactor without regard for business value cause their own problems. Senior engineers must navigate both.",
    "It arises for lead and senior roles, when discussing legacy systems, estimation, and how you maintain quality under deadlines.",
    "Do not say that you rewrite everything, that debt is the previous team's fault, or that you never take on debt. Avoid vague claims such as we cleaned it up with no outcome.",
    "Describe how you found and listed the debt, measured its cost (lead time, incidents, onboarding time), prioritised by interest, proposed a fixed capacity share or tied refactoring to upcoming features, delivered in small safe steps with tests, and showed the improvement in metrics.",
    "Taking on debt deliberately to hit a date can be right if it is recorded and repaid. The nuance is making it visible and agreeing a pay-back plan, rather than pretending it is zero.",
    "Other angles are inheriting a legacy codebase, modernising incrementally with the strangler pattern, or deciding not to refactor something because the risk outweighed the value.",
    `Situation: Our reporting module had grown without tests, and every change in it took about three times longer than elsewhere and caused regular production bugs.
Task: I needed to reduce that cost without stopping feature work.
Action: I measured the cost: eight of the last twenty incidents were in that module and the average change took six days. I presented this to the product owner with a proposal to reserve 15 percent of each sprint for it and to link refactoring to the next three planned features. We added characterisation tests first, extracted the worst class into smaller units and added a static analysis gate to prevent new debt.
Result: After three months, incidents in that module dropped to one per quarter, average change time fell from six days to two, and product agreed to keep the capacity reservation as a standing practice. The key lesson for me was that framing debt as lost delivery time, rather than as ugly code, is what made the business listen.`
  ],
  "Estimation and Planning": [
    "Show that you estimate in ranges with stated assumptions, break work into small slices, include risk and dependencies, communicate uncertainty early, and re-plan when facts change. The honest answer is that estimates are forecasts, not promises.",
    "They are asking whether people can rely on your timelines, how you handle unknowns, and how you respond when you are going to miss a date.",
    "Missed deadlines damage trust. Senior engineers help product and management make decisions, so their estimates need to be calibrated and their risks visible.",
    "It comes up in questions about a missed deadline, large projects, planning a migration, or pressure to commit to unrealistic dates.",
    "Do not say that you just add a buffer, that estimates are impossible, that you always deliver on time, or that you caved to an unrealistic date and then worked nights.",
    "Break the work down, estimate with a range or three-point approach, list assumptions and risks, spike the largest unknowns first, deliver in thin vertical slices, track progress against the plan, and report early with options (scope, date, resources) when it slips.",
    "Estimates improve with historical data, such as past cycle times. Padding in secret erodes trust, whereas explicit contingency and ranges are honest. Smaller slices reduce error.",
    "Other angles are using story points versus time estimates, probabilistic forecasting from throughput, or how you push back on a date set top-down.",
    `Situation: We had to migrate a customer database to a new platform, and the business wanted a firm date within a day of asking.
Task: I was responsible for the plan and needed to give a credible commitment.
Action: I asked for two days to break the work down. I split it into eleven slices, spiked the riskiest part (data volume and cut-over time) in a short experiment, and gave a range of eight to eleven weeks with three explicit assumptions and two risks. I proposed a checkpoint at week four to confirm the date and offered options to reduce scope if needed. During the project I reported progress weekly.
Result: We found one data quality problem at week three, flagged it immediately, and agreed to cut a non-essential report. We finished in ten weeks, within the range, and the stakeholders later asked to use the same approach for other projects.`
  ],
  "Code Review Culture": [
    "A healthy review culture is fast, respectful and focused on correctness, design and shared learning rather than style nitpicks that tools can enforce. You set expectations (small pull requests, clear descriptions, quick turnaround), automate trivia, and model kind, specific feedback.",
    "They are asking how you keep quality high without becoming a bottleneck, and how you give and receive critical feedback without damaging relationships.",
    "Reviews catch defects early, spread knowledge and set standards, but done poorly they cause delays, conflict and defensiveness.",
    "It comes up for senior and lead roles, in discussions about quality practices, conflict over reviews, or onboarding new engineers.",
    "Do not describe gatekeeping reviews where you rewrite others' code, comment only on style, leave pull requests waiting for days, or approve without reading to keep things moving.",
    "Describe your practices: keep pull requests small, use a checklist (behaviour, tests, design, security), automate style with linters and formatters, comment on the code with reasons and suggestions, separate must-fix from nice-to-have, set a turnaround target, and review your own work first.",
    "Speed and thoroughness pull in opposite directions, so agree on a service level (for example first response within four hours). Pair programming can replace some reviews for risky changes. Seniors should get reviewed too.",
    "Other angles are handling a heated disagreement in review, reviewing across time zones, or changing a culture of rubber-stamp approvals.",
    `Situation: In my team, pull requests waited an average of three days for review, were often large, and comments were frequently about formatting, which frustrated authors.
Task: As a senior engineer I was asked to improve review quality and speed.
Action: I proposed a short working agreement with the team: pull requests under 400 lines where possible, a description template, formatting handled by an automated formatter and linter, and a target of first feedback within one working day. I marked comments as must-fix or optional, and I started asking questions instead of issuing orders. I also asked juniors to review my own pull requests so they could see how I think and challenge it.
Result: Average review time dropped from three days to about six hours, formatting comments disappeared, and a survey two months later showed the team felt reviews were more useful. Escaped defects fell by roughly a quarter that quarter.`
  ],
  "Conflict with a Teammate": [
    "Show that you address conflict early, directly and privately, focus on the problem and shared goal rather than the person, seek to understand their view, and reach a workable agreement. A strong story ends with a better working relationship, not just a win.",
    "They want to see emotional intelligence, maturity and communication. They are checking whether you avoid conflict, escalate too quickly or hold grudges.",
    "Engineers rarely work alone, and unresolved conflict hurts delivery and morale. Senior engineers are expected to model constructive disagreement.",
    "It comes up in almost every loop, often phrased as a time you disagreed with a colleague or worked with a difficult person.",
    "Do not describe the other person as stupid or lazy, claim you have never had a conflict, tell a story where you simply proved them wrong, or run to your manager as the first step.",
    "Set the scene neutrally, state the real issue (for example a disagreement about an approach), describe how you spoke privately, listened first, found shared goals, used data or an experiment to decide, and what you agreed. End with the result and how the relationship is now.",
    "Not all conflicts end in agreement; sometimes you disagree and commit. Be careful to show empathy without sounding passive. Avoid stories about personality clashes with no technical or delivery stake.",
    "Other angles are a conflict between two teammates you mediated, or a disagreement across teams about priorities and ownership.",
    `Situation: A teammate and I disagreed on how to design a new notification feature. He wanted a quick in-process implementation, and I wanted a queue-based design because of expected growth. The discussion in the team channel became tense.
Task: We needed to decide within a week, and I wanted to resolve it without damaging the working relationship.
Action: I asked him for a one-to-one coffee, said I wanted to understand his concerns, and learned he was worried about delivery time and operating a new queue. I acknowledged those risks, and we agreed to compare the options against measurable criteria: effort, failure behaviour and expected load. We built a small spike of both, and the numbers showed the queue added only two days of work and handled retries much better.
Result: We chose the queue-based approach with his simplification of the retry logic, shipped on time, and he later invited me to review his next design before sharing it widely.`
  ],
  "Disagreeing with Your Manager": [
    "Show that you disagree respectfully, with evidence and in private, offer alternatives rather than only objections, and commit fully once a decision is made, while keeping the option to raise new facts. The story should show courage and loyalty to the goal together.",
    "They are testing whether you can speak up when something is wrong, and whether you can still follow a decision you disagree with. Both pure compliance and pure rebellion are red flags.",
    "Managers want engineers who surface risk early, and organisations suffer when people stay silent about problems or undermine decisions.",
    "It comes up in questions on integrity, pushing back on deadlines or scope, and times you changed a manager's mind or failed to.",
    "Do not describe going over your manager's head first, complaining to peers, passive resistance after the decision, or a story where you were obviously right and they were foolish.",
    "Explain the context and the manager's reasoning fairly, how you prepared data and options, raised it privately with the impact on goals, listened to constraints, and what was decided. If overruled, state how you committed and helped it succeed; if persuaded, say how.",
    "Disagree and commit does not mean silence: record your concern, propose a checkpoint or metric that would show whether the decision is working. Choose battles that matter.",
    "Other angles are disagreeing on priorities, hiring decisions, architecture direction or on a deadline you believed was unrealistic.",
    `Situation: My manager wanted to ship a new payment feature in four weeks to meet a partner commitment and to skip load testing to save time. I was concerned about our capacity at partner volumes.
Task: I needed to raise the risk without blocking the partner deal.
Action: I asked for a short one-to-one and presented a simple estimate of the expected peak against our measured capacity, which showed a likely shortfall. I did not just say no: I proposed a two-day targeted load test and a feature flag for a staged rollout. My manager explained the commercial pressure, so we agreed on the staged approach but with the test limited to two days instead of five.
Result: The test found a connection pool limit, which we fixed before launch. The rollout went smoothly, the partner deadline was met, and my manager now asks for my capacity view early in planning.`
  ],
  "Handling Failure and Mistakes": [
    "Choose a real mistake with real consequences, own it without excuses, explain how you contained and fixed it, and show the lasting changes you made so it cannot recur. They are hiring your learning ability and accountability, not a perfect record.",
    "They are looking for honesty, ownership and growth, and for how you behave under pressure when something you did goes wrong.",
    "Everyone makes mistakes, but the response differentiates seniors. Blame-shifting or hiding errors is a serious risk to trust and production safety.",
    "It comes up as a time you failed, made a mistake or learned a hard lesson, and often as follow-up to an incident story.",
    "Do not give a fake failure (I care too much), blame others or circumstances, choose something trivial, or pick a catastrophic story with no recovery or lessons.",
    "State the mistake plainly in your own words, the impact, how you communicated and mitigated quickly, the root cause (process, not only people), the specific changes you introduced (tests, checklists, safeguards) and how the result has been since.",
    "Blameless culture is a mindset: you take responsibility for your part while also fixing the system that allowed the error. Avoid over-apologising or dwelling in guilt.",
    "Other angles are a failed project, a wrong estimate, a hiring mistake, or a decision you made with incomplete information.",
    `Situation: I ran a data clean-up script directly against a production table, and a missing filter condition deleted about two percent of records in a customer-facing table.
Task: I had to restore the data quickly and tell people what happened.
Action: I stopped the script within a minute, told my manager and the on-call lead immediately, and we restored the affected rows from a point-in-time backup in about 40 minutes. I wrote a short, blameless post-incident summary that described my part openly. The root cause was that anyone could run ad hoc scripts on production without a dry run or peer review. We introduced a rule that production data scripts run first in staging with a dry-run mode, require a second reviewer, and execute inside a transaction.
Result: No customer data was permanently lost, and customers saw only a short inconsistency. The new process has caught two risky scripts since, and I now use it as an example when mentoring.`
  ],
  "A Production Incident Story": [
    "Pick an incident where you played a real role, and tell it in order: detection, mitigation first, diagnosis, resolution, communication and prevention. They want calm, structured thinking under pressure and a blameless learning outcome.",
    "They are assessing how you behave when systems fail: whether you prioritise restoring service, coordinate others, communicate clearly and follow through with real fixes.",
    "Senior engineers are the ones on call and leading incidents. Technical depth under pressure and the ability to prevent repeats are central to the role.",
    "It appears in senior backend, SRE and lead interviews, often as tell me about your worst outage or a time you debugged a hard problem.",
    "Do not blame an individual, skip impact numbers, claim you fixed everything alone, or describe heroics without prevention. Do not reveal confidential names or customer details.",
    "Give the impact (users, duration, revenue), how it was detected, what you did first to mitigate (rollback, scale, feature flag), how you found the root cause with evidence (metrics, logs, dumps), who you coordinated and informed, the permanent fix, and the follow-up actions with owners.",
    "Mitigation before root cause is the key principle. Be honest about what went wrong in detection or process too, since every real incident has contributing factors beyond the trigger.",
    "Other angles are an incident you prevented through a near-miss review, a slow-burn problem like a memory leak, or how you improved on-call after an incident.",
    `Situation: On a busy evening our order API started returning errors for about 30 percent of requests, and alerts fired within two minutes.
Task: I was the on-call engineer and incident lead, and my goal was to restore service first and understand the cause second.
Action: I checked recent deployments and saw one 20 minutes earlier, so I rolled it back, but errors continued. Database metrics showed the connection pool exhausted, and a thread dump showed many threads waiting on a slow downstream call without a timeout. I enabled a circuit breaker setting via configuration and scaled out temporarily, which recovered service in 35 minutes in total. Meanwhile I updated stakeholders every 15 minutes in a shared channel.
Result: Impact was about 20,000 failed requests. In the post-incident review we added default timeouts to all HTTP clients, bulkheads for the pool, an alert on pool saturation and a load test for the downstream failure case. No similar incident has occurred since.`
  ],
  "Tight Deadlines and Scope": [
    "Show that under deadline pressure you protect the outcome by negotiating scope rather than quality: clarify what must be delivered, cut or defer the least valuable work, communicate trade-offs early, and deliver an incrementally usable result. Heroics and silent overtime are not the answer.",
    "They want to see prioritisation, communication and judgement about quality versus speed, and whether you can say no or offer options.",
    "Deadlines are a constant reality. The risk is shipping fragile software or burning out the team, and seniors are expected to manage both.",
    "It comes up in questions about conflicting priorities, an unrealistic deadline, scope creep, or delivering under pressure.",
    "Do not say that you worked every weekend to make it happen, that you skipped testing, or that you refused. Do not blame product for the pressure.",
    "Describe how you confirmed the real fixed point (date, scope or quality), split features into must-have and could-have with the stakeholders, delivered a thin vertical slice first, used feature flags, protected critical quality gates such as tests for payment paths, and communicated progress and risks frequently.",
    "Cutting scope is almost always better than cutting quality or extending hours, but some compromises create debt. Record any deliberate shortcut with an owner and a plan to repay it.",
    "Other angles are handling scope creep mid-project, dealing with a deadline set before requirements are clear, or helping a stressed team through crunch.",
    `Situation: We were asked to deliver a new customer onboarding flow in six weeks to align with a marketing campaign. After breaking down the work, I estimated about nine weeks.
Task: I had to propose a way to hit the campaign date without a risky release.
Action: I met the product owner and walked through the list. We separated must-have steps (registration, identity check, welcome email) from nice-to-have items (profile personalisation, analytics dashboard). I proposed delivering the must-haves behind a feature flag, keeping automated tests for the identity and payment parts, and releasing the rest in two later increments. I gave a weekly status with the remaining risk.
Result: We launched the core flow on the campaign date, with no significant incidents. The deferred items shipped three and five weeks later, and the team avoided overtime, which kept morale and quality high. Looking back, the value came from agreeing the priority order with product early, so the cut-down scope was a shared decision rather than a surprise.`
  ],
  "Ownership and Initiative": [
    "Show that you act on problems nobody has asked you to solve, take responsibility for outcomes beyond your task list, and follow through to measurable results. A good story starts with noticing a gap, ends with lasting improvement, and shows you brought others along.",
    "They are asking whether you wait for instructions or take the lead, and whether you care about the result, not just completing tickets.",
    "Senior engineers are expected to find and fix systemic problems, raise risks and treat the product as theirs. This distinguishes seniors from experienced task executors.",
    "It comes up in questions such as a time you went above and beyond, took initiative, or improved something without being asked.",
    "Do not describe heroics that bypassed the team, taking over work from others, a trivial tidy-up, or something you did for visibility that did not help anybody.",
    "Describe the problem you noticed and the evidence, why it mattered, how you got agreement or time, the actions you took including enlisting others, and the measurable result and how it continued after you.",
    "Ownership is not doing everything yourself. Real ownership includes making the thing sustainable, documenting it and handing it over. Balance initiative with alignment so you do not create surprises.",
    "Other angles are owning an on-call rotation improvement, proposing a process change, or taking over an abandoned component nobody wanted.",
    `Situation: I noticed that our nightly batch job failed silently about once a month, and finance only discovered missing reports days later. Nobody owned the job after its author had left.
Task: Nothing in my backlog covered this, but I felt it was a real risk, so I took it on.
Action: I checked the history and found six silent failures in the last half-year. I raised it with my manager, who agreed to a few days of my time. I added alerting on job failure and duration, made the job idempotent so it could be rerun safely, wrote a short runbook, and held a thirty-minute session so two teammates could operate it. I also moved it onto the standard scheduling platform.
Result: There have been no unnoticed failures since; the two failures that did occur were fixed within an hour using the runbook. Finance stopped sending manual checks, and the approach became our template for other scheduled jobs.`
  ],
  "Handling Ambiguity": [
    "Show a method for unclear problems: ask clarifying questions, state assumptions explicitly, break the problem down, test the riskiest assumptions with small experiments, and make reversible decisions quickly. Comfort with ambiguity means reducing it deliberately, not waiting for perfect information.",
    "They want to know whether you freeze, guess blindly, or create clarity for yourself and others when requirements are vague.",
    "Real senior work rarely arrives well specified. Teams depend on seniors to turn fuzzy goals into concrete, testable plans.",
    "It comes up with questions about vague requirements, a new domain, changing priorities, or a project without clear ownership.",
    "Do not say you wait until requirements are complete, that you just started coding, or that you assumed and never checked. Do not present ambiguity as someone else's failure.",
    "Describe how you identified what was unknown, asked stakeholders targeted questions, wrote down assumptions and got them confirmed, picked the smallest experiment or prototype to reduce risk, delivered an early slice for feedback and adapted the plan.",
    "Too much analysis is as harmful as too little. Match effort to reversibility: move fast on two-way decisions, slow down on one-way ones. Communicate your assumptions so others can correct them.",
    "Other angles are joining a team mid-flight, working in a new domain, or interpreting a high-level business goal with no designed solution.",
    `Situation: Product asked us to improve search relevance with only that sentence as the brief, with no metrics, no definition of better and no deadline.
Task: As the senior engineer I needed to turn this into something we could build and measure.
Action: I met the product owner and support team to understand the complaints, and we picked the top ten failing queries as concrete examples. I wrote down our assumptions, for instance that typo tolerance and synonyms were the main gaps, and proposed a measurable goal: the share of searches with a click within the first three results. I built a quick prototype with fuzzy matching, tested it on logged queries offline, and showed results after one week to adjust direction.
Result: We agreed on a metric, shipped two improvements in six weeks, and the click-through on top results rose by about 12 percent. The product owner reused the same approach, with examples and a metric, for the next vague request.`
  ],
  "Cross-Team Collaboration": [
    "Show that you build relationships before you need them, understand the other team's goals and constraints, agree on interfaces and expectations explicitly, communicate regularly and resolve conflicts of priority through shared objectives. A good story shows both teams succeeding.",
    "They are asking whether you can work effectively with people who have different incentives, such as platform, product, security or operations teams, and keep delivery moving.",
    "Most large deliveries cross team boundaries, and delays usually come from misaligned priorities and unclear contracts, not from code.",
    "It comes up in questions about dependencies, working with other departments, integration projects and shared platforms.",
    "Do not blame the other team for delays, describe working around them, rely only on escalation, or speak about other teams with contempt.",
    "Explain the shared goal, how you met the other team to understand their roadmap and constraints, agreed an API or contract and delivery dates, set up a regular sync and a shared channel, and handled a change or conflict openly. Finish with the outcome for both teams.",
    "Both sides have competing priorities, so sometimes the answer is to adapt your plan or contribute work to their backlog. Contract tests and written agreements reduce misunderstandings.",
    "Other angles are collaborating with product and design, with security reviewers, with operations during releases, or with an external vendor.",
    `Situation: Our team needed a new fraud-check API from a platform team, but it was not on their roadmap for two quarters, and our launch depended on it.
Task: I had to find a way to deliver on time without damaging the relationship or waiting.
Action: I met their tech lead to understand their constraints; they were short of capacity and worried about quality. I proposed that two of our engineers contribute the first version under their guidelines, with their review, and I wrote an API contract with example requests so both sides agreed on the behaviour. We held a short weekly sync and shared a channel for questions, and I made sure the platform team received credit in our release notes.
Result: The API shipped in five weeks instead of six months, we launched on time, and the platform team adopted our contract tests for their other consumers. The two teams now plan quarterly dependencies together.`
  ],
  "Questions to Ask the Interviewer": [
    "Ask three to five thoughtful questions that show you are evaluating the role as seriously as they evaluate you: the team's real challenges, how success is measured, engineering practices, decision-making and growth. Avoid questions answered by the website, and avoid asking about salary and holidays in a technical round.",
    "They are looking at your curiosity, priorities and seniority: what you care about reveals whether you think about impact, quality and team health.",
    "The end of the interview is your chance to gather information to decide, and good questions leave a strong last impression. Having none suggests low interest.",
    "Asked at the end of every round, with different questions for recruiters, hiring managers, peers and senior leaders.",
    "Do not ask what the company does, ask only about benefits, say you have no questions, or ask questions that signal you are avoiding work such as how early can I leave.",
    "Prepare a list per interviewer type, listen during the interview to ask a follow-up based on what they said, and choose questions you actually want answered. Take notes, and ask about what a great first six months looks like.",
    "Questions about problems, such as what is the hardest thing about this team right now, reveal more than questions about perks. Do not be confrontational and do not interrogate; keep it a conversation.",
    "Angles by interviewer: manager (success, expectations, team structure), engineer (code review, deployments, on-call), leader (strategy, investment in engineering). You can also ask what concerns they have about your fit.",
    `For the hiring manager:
1. What would a successful first six months look like for this role, and how will success be measured?
2. What are the biggest technical or organisational challenges the team is facing right now?
3. How are architectural decisions made here, and how much input would a senior engineer have?

For an engineer on the team:
4. How does a change get from a pull request to production, and how often do you deploy?
5. What does on-call look like, and how are incidents reviewed?
6. How is technical debt handled in planning?

To close:
7. Is there anything about my background that gives you pause, so I can address it now?`
  ],
  "Salary and Notice Negotiation": [
    "Negotiate calmly and professionally: research market ranges, understand your priorities across total compensation, let them make the first offer where possible, ask rather than demand, and be honest about your notice period. Keep the relationship warm because you will work together.",
    "They want to see that you know your worth, communicate clearly and handle a business conversation without drama, since seniors negotiate with stakeholders daily.",
    "Compensation and start date are set at the offer stage, and a poorly handled negotiation can sour a relationship or leave value on the table.",
    "It comes up with recruiters when they ask for expectations, at the offer, and when discussing notice period buy-outs or an earlier joining date.",
    "Do not lie about your current pay or competing offers, give an ultimatum, accept or reject immediately, discuss money in technical rounds, or insult the offer. Do not break your contractual notice obligations lightly.",
    "Research market data for the role and location, define your priorities (base, bonus, equity, flexibility, learning, title), when asked first respond with a range anchored on the role's market value, thank them for the offer, ask for time, make a specific reasoned request, and agree notice and start date in writing.",
    "Total compensation includes more than base pay, and some employers cannot move on salary but can on bonus, review timing or leave. A fair earlier start date may require a notice buy-out from the new employer, and both employers' contracts must be respected.",
    "Other angles are handling a counter-offer from your current employer, negotiating a level or title, or asking for a delayed start for a planned break.",
    `When the recruiter asks about expectations:
I would like to understand the full scope of the role first. Based on my research for senior roles with this responsibility in this market, I am looking for a total package in the typical range for the level, and I am flexible depending on the whole package, including bonus, growth and flexibility.

When I receive the offer:
Thank you very much, I am excited about the role and the team. Could I have a couple of days to review the full details? I will come back with any questions.

When making the request:
I would really like to join. Given my experience leading platform work and the scope of this position, I was hoping we could look at the base component. Is there flexibility there? I am also happy to discuss other parts of the package.

On notice:
My contract has a notice period, and I want to leave on good terms and complete a proper handover. Could we agree a start date that allows this, and if an earlier date is important to you, I can ask whether my employer would consider a shorter period.`
  ]
};
