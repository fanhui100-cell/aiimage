# Passage Answer Key Audit

Generated: 2026-06-17T22:37:38.751Z

Scope: active `banked_cloze` and `seven_select` rows. This report is read-only; no database rows were changed.

## Summary

| Type | Rows | Shape issue rows | Confirmed wrong rows | Confirmed wrong blanks | Ambiguous rows | AI error rows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| banked_cloze | 210 | 0 | 2 | 2 | 29 | 1 |
| seven_select | 165 | 0 | 4 | 4 | 39 | 0 |

## Confirmed Wrong

### banked_cloze-bp-cet4-oc0grf
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that success comes from one big (1) event or a sudden breakthrough. However, research shows that daily small habits are far more (2) in shaping our future. For 
- Blank 1: current `2:dramatic` -> suggested `3:significant`; confidence 0.85; 'Dramatic' implies suddenness, contradicting the contrast with gradual habits; 'significant' fits the collocation and meaning better.

### banked_cloze-bp-cet6-1ceu42y
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid advancement of artificial intelligence has sparked a heated (1) among experts and the general public alike. While some view it as a tool for unprecedented progress, other
- Blank 2: current `11:worry` -> suggested `1:fear`; confidence 0.95; 'worry' is a noun; the blank requires a verb. 'fear' can be used as a verb and fits the structure.

### seven_select-sp-kaoyan-10zdhmd
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of ourselves, the boundary between being connected and being overloaded has grown increasingly thin. (1) However, a growing b
- Blank 1: current `1:The constant notifications and updates keep us perpetually alert, yet often leave us feeling mentally exhausted.` -> suggested `0:Many people pride themselves on being able to multitask efficiently across various apps and platforms.`; confidence 0.85; The passage opens with a general statement about connectivity, then uses 'However' to introduce a contrasting research finding. Option A provides a positive common belief that sets up the contrast, while Option B is already negative and makes the 'However' less logical.

### seven_select-sp-kaoyan-gsf8jy
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices constantly demand our attention, a growing number of people are turning to digital minimalism as a remedy. This philosophy advocates intentionally r
- Blank 1: current `2:Adherents report improved mental health, stronger interpersonal bonds, and greater productivity.` -> suggested `6:Nevertheless, many find it impractical to abandon digital tools entirely in a connected world.`; confidence 0.9; Option C redundantly lists benefits after the preceding sentence already states them; G provides a necessary concessive transition to criticism.

### seven_select-sp-中考-1ub0wev
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last month, our school held a sports meeting. I took part in the 4×100-meter relay race with my three classmates. (1) We practiced every day after school for two weeks. On the race
- Blank 2: current `3:I was the last runner of our team.` -> suggested `2:The other teams were all very strong.`; confidence 0.85; The current key 'I was the last runner' is irrelevant to the context of nervousness and the first runner's action; the suggested option logically explains the nervousness.

### seven_select-sp-中考-z3oj4r
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I took out some colored paper and drew a b
- Blank 4: current `5:However, I didn’t know what to do at first.` -> suggested `4:I spent all my money on a toy.`; confidence 0.9; The current key is a flashback that disrupts the chronological order; the suggested option provides a logical contrast to the lesson about love vs. money.


## Ambiguous / Needs Human Review

### banked_cloze-bp-cet4-10qooc6
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `8:implementing`; suggested `4:temporary`; 'implementing such a break' is grammatically possible as a gerund subject, though less common; 'temporary such a break' is ungrammatical. The blank could also be filled by 'taking' or 'having', but those are not in the bank. Thus, the current key is not clearly wrong, and the suggested option does not fit grammatically.

### banked_cloze-bp-cet4-15t5jmy
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `1:thought`; suggested `5:presence`; Both 'deep thought' and 'deep presence' are plausible; the current key is acceptable but not uniquely correct.

### banked_cloze-bp-cet4-1aoh8u7
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:conscious`; suggested `11:clear`; 'conscious break' can be interpreted as a deliberate, mindful break, which is acceptable in context; 'clear break' is also plausible but not clearly superior.

### banked_cloze-bp-cet4-1cn96uu
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `4:impact`; suggested `12:reward`; 'impact' is acceptable and not problematic due to reuse; 'reward' is also plausible but not clearly more correct.

### banked_cloze-bp-cet4-1cqu385
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `7:continuous`; suggested `14:reliable`; 'continuous support' is acceptable in context of ongoing government backing; both 'continuous' and 'reliable' are plausible.

### banked_cloze-bp-cet4-1ew8qwv
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `5:emptiness`; suggested `6:confusion`; Both 'emptiness' and 'confusion' can fit the context of boredom; 'hint of emptiness' is not unnatural.

### banked_cloze-bp-cet4-1l68c2d
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `9:effective`; suggested `5:meaningful`; Both 'effective response' and 'meaningful response' are plausible; the passage does not clearly favor one over the other.

### banked_cloze-bp-cet4-7m6p93
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `9:control`; suggested `4:momentum`; Both 'sense of order and control' and 'sense of order and momentum' are plausible; the context supports either.

### banked_cloze-bp-cet4-he0pdi
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `5:approach`; suggested `1:method`; Both approach and method are possible; approach is not clearly wrong.

### banked_cloze-bp-cet4-k6owls
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `14:serious`; suggested `2:negative`; Both 'serious problem' and 'negative problem' are grammatically and semantically acceptable; 'negative' is slightly more natural but not clearly wrong.

### banked_cloze-bp-cet4-kneb7h
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `0:interrupted`; suggested `3:distracted`; Both 'interrupted' and 'distracted' are plausible; 'interrupted' fits the idea of constant disruption, while 'distracted' is a common collocation. Neither is clearly wrong.

### banked_cloze-bp-cet4-oc0grf
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `8:demonstrate`; suggested `14:confirm`; Both 'demonstrate' and 'confirm' are grammatically and semantically acceptable; 'confirm' is slightly more natural but not clearly required.

### banked_cloze-bp-cet4-wcckm1
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `10:valued`; suggested `12:ignored`; 'Valued' can be used neutrally or ironically in context; 'ignored' also fits but not clearly more correct.

### banked_cloze-bp-cet4-ydcsjn
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `10:feature`; suggested `12:creative`; 'feature' can be interpreted as a characteristic or aspect of urban gardening, which fits the context; 'creative' is also plausible but not clearly more correct.

### banked_cloze-bp-cet4-yzfov2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:effective`; suggested `2:reliable`; Both 'effective' and 'reliable' are plausible; 'surprisingly effective' is a common collocation, and the context does not clearly favor one over the other.
- Blank 10: current `2:reliable`; suggested `7:effective`; Both 'reliable tool' and 'effective tool' are natural; the passage does not strongly disambiguate which is better.

### banked_cloze-bp-cet4-z6cfo
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `10:trust`; suggested `10:trust`; 'build trust' is acceptable, but 'build connection' (option F) is also plausible.

### banked_cloze-bp-cet6-118fkzt
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `9:triggered`; suggested `6:enhanced`; 'triggered' is acceptable in context; 'enhanced' is not clearly better.

### banked_cloze-bp-cet6-16x645e
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `7:simplicity`; suggested `7:simplicity`; The passage discusses reducing screen time and engaging natural abilities; 'simplicity' can be interpreted as a lifestyle of simplicity that includes conscious engagement, so it is not clearly wrong.

### banked_cloze-bp-cet6-16yzuwz
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `5:reach`; suggested `5:reach`; 'reach' as a noun meaning 'extent' or 'range' is acceptable in context, though not ideal; no better option in the bank.

### banked_cloze-bp-cet6-19j1m0u
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `3:clear`; suggested `9:rigid`; 'clear boundaries' is a common and acceptable collocation; the context does not require 'rigid' as the only correct option.

### banked_cloze-bp-cet6-1bzxs2i
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `7:moderate`; suggested `3:balanced`; 'moderate integration' is acceptable and conveys a similar meaning; both 'moderate' and 'balanced' fit the context.

### banked_cloze-bp-cet6-1u733e4
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `8:serenity`; suggested `6:tranquility`; Both 'serenity' and 'tranquility' are acceptable; 'crave serenity from notifications' is not unidiomatic.
- Blank 7: current `6:tranquility`; suggested `8:serenity`; Both 'tranquility' and 'serenity' fit naturally; 'heightened sense of tranquility and creativity' is fine.

### banked_cloze-bp-cet6-bp7o9h
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `1:sustainability`; suggested `2:recycled`; 'Sustainability' is a valid abstract noun that fits the contrast with speed; 'recycled' would require a noun like 'materials' to be grammatical. Both are possible but the current key is acceptable.

### banked_cloze-bp-cet6-fdg57b
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `12:temporary`; suggested `-1:`; 'temporary employment benefits' is unusual but could be interpreted as benefits for temporary workers; no clearly correct alternative exists in the bank.
- Blank 6: current `2:vulnerability`; suggested `7:fragility`; 'vulnerability of data privacy' is not standard, but 'fragility' is also not ideal; both are possible in a loose sense, and no perfect option exists.

### banked_cloze-bp-cet6-fnzn4h
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `11:underestimated`; suggested `2:overlooked`; Both 'underestimated' and 'overlooked' are grammatically correct and semantically plausible; 'overlooked' is slightly more natural but not clearly superior.
- Blank 5: current `9:dilemma`; suggested `5:paradox`; Both 'dilemma' and 'paradox' fit the context; 'paradox' may be slightly more precise but the current key is acceptable.

### banked_cloze-bp-cet6-h3xw34
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `10:presence`; suggested `6:imbalanced`; 'presence' is a noun and fits grammatically; 'imbalanced' is an adjective and cannot follow 'the' directly. The intended meaning likely requires 'imbalance', which is not an option. Thus the current key is acceptable, though not ideal.

### banked_cloze-bp-cet6-mbcf6n
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `10:strict`; suggested `2:relaxed`; Both 'strict' and 'relaxed' could fit: 'strict boundaries' is a common collocation and the passage does not explicitly rule out strictness; the contrast is with total abstinence, not with strictness.

### banked_cloze-bp-cet6-ng1zcd
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `14:impacts`; suggested `-1:`; 'impacts' is acceptable as a plural noun; 'merits' could also fit but less likely in negative context.

### banked_cloze-bp-cet6-oj0k7s
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 7: current `14:enthusiasm`; suggested `14:`; 'enthusiasm' is not ideal but can be interpreted as 'the enthusiasm for digital minimalism may be short-lived', which is acceptable; no clearly better option in the bank.

### seven_select-sp-kaoyan-10pripf
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `3:Yet the very structure of digital minimalism can paradoxically create new forms of isolation.`; suggested `4:Such serendipity is difficult to replicate through deliberate online networking.`; Both D and E can fit; D's point about isolation connects to over-censoring, while E's serendipity links to earlier informal exchanges.
- Blank 5: current `4:Such serendipity is difficult to replicate through deliberate online networking.`; suggested `3:Yet the very structure of digital minimalism can paradoxically create new forms of isolation.`; Both D and E could work as a concluding point; D offers a paradox leading to the final sentence, but E also fits as a summary of the serendipity theme.

### seven_select-sp-kaoyan-10zdhmd
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `2:Studies indicate that frequent task-switching can reduce overall productivity by as much as 40%.`; suggested `6:Such addictive patterns make it increasingly difficult to disengage from the digital environment.`; Both C and G are plausible. C offers a relevant statistic about task-switching, but G directly follows the addictive patterns in blank 4 and leads more smoothly into the recommendation. The current key is not clearly wrong.

### seven_select-sp-kaoyan-1242wky
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `5:This perspective, however, overlooks the fact that not everyone can afford to opt out of the digital economy.`; suggested `3:D. Many people find it impossible to maintain a balanced digital diet without external support.`; F is acceptable as it continues the critique of individualistic solutions, but D also fits; both are plausible.

### seven_select-sp-kaoyan-12resji
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `1:The constant flow of notifications and the pressure to remain ‘always on’ have been linked to increased rates of anxiety and depression.`; suggested `0:A. Employees, in turn, feel compelled to respond to messages at all hours, blurring the line between being ‘at work’ and ‘off duty.’`; Both B and A are plausible; B fits the cause-effect of techno-stress, while A continues the organizational encouragement theme.
- Blank 4: current `0:Employees, in turn, feel compelled to respond to messages at all hours, blurring the line between being ‘at work’ and ‘off duty.’`; suggested `1:B. The constant flow of notifications and the pressure to remain ‘always on’ have been linked to increased rates of anxiety and depression.`; Both A and B can logically follow the fragmented attention sentence; A leads into 'right to disconnect' policies, B provides a consequence.

### seven_select-sp-kaoyan-1jvydjm
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `3:This is why many companies offer a limited number of product variants to simplify consumer decisions.`; suggested `5:Therefore, the key to happiness lies in learning to embrace constraints and appreciate simplicity.`; Option D can be seen as a logical extension of the previous sentence about regret and overload, introducing a practical consequence (companies simplifying choices) that leads into the example. Option F is also plausible as a concluding remark, but the example that follows is more illustrative of a general point than a direct conclusion. Both fit, so ambiguous.
- Blank 5: current `5:Therefore, the key to happiness lies in learning to embrace constraints and appreciate simplicity.`; suggested `3:This is why many companies offer a limited number of product variants to simplify consumer decisions.`; Option F is a natural concluding statement for the paragraph, and the following sentence about 'understanding the psychological impact' serves as a broader wrap-up. Option D could also fit as a specific example before the final summary, but the flow is less smooth. Both are acceptable, so ambiguous.

### seven_select-sp-kaoyan-1s5nn4e
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 2: current `3:The pressure to maintain an online persona often leads to stress and burnout.`; suggested `4:Studies have shown that excessive screen time is linked to poor sleep quality and depression.`; Both D and E are plausible after the mention of digital fatigue and checking habits; D fits the theme of psychological costs, while E offers a research-based consequence.
- Blank 3: current `1:Social media platforms are designed to be addictive, exploiting psychological vulnerabilities.`; suggested `0:Many people report feeling overwhelmed by the constant stream of notifications and updates.`; Both B and A are acceptable; B's focus on addictive design fits the irony of isolation, while A's symptom of overwhelm also works.

### seven_select-sp-kaoyan-1smab29
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `3:The same technology that connects us also makes withdrawal socially awkward.`; suggested `5:F. Studies show that heavy social media use correlates with higher rates of anxiety.`; Option D can serve as a concluding remark linking technology's dual role to the paragraph's theme, while option F introduces a new point not directly supported by preceding sentences; both are plausible but D is not clearly wrong.

### seven_select-sp-kaoyan-392i5x
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `2:Instead, we should embrace periodic digital detoxes and set clear boundaries for screen time.`; suggested `4:Therefore, universities have begun implementing policies that restrict smartphone use in classrooms.`; The example of college students could lead to either a specific policy response (E) or a general recommendation (C); the 'Yet' sentence can follow both, making the choice not clearly wrong.

### seven_select-sp-kaoyan-8tw2je
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `6:Yet the same technology that empowers us also entraps us in a cycle of perpetual distraction.`; suggested `5:Some experts argue that digital detox retreats are merely temporary fixes for a systemic problem.`; Both G and F are plausible; G fits the general theme of distraction, while F introduces systemic problem that leads to the call for disconnection.
- Blank 5: current `1:Many people now report feeling anxious when separated from their devices for even a short period.`; suggested `5:Some experts argue that digital detox retreats are merely temporary fixes for a systemic problem.`; B fits as a concluding example, but F creates rhetorical tension with the final call for disconnection; both are acceptable.

### seven_select-sp-kaoyan-bbi9u9
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `6:The brain requires a recovery period after each switch to refocus.`; suggested `4:Such findings challenge the widely held belief that multitasking boosts efficiency.`; Both G and E are plausible: G elaborates on the cognitive cost mentioned in the previous sentence, while E ties the preceding evidence to the overall argument. Neither is clearly wrong, so ambiguous.

### seven_select-sp-kaoyan-c8eqw9
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `5:In fact, the absence of physical presence has made it harder for managers to assess employee performance accurately.`; suggested `4:Remote work also offers unparalleled flexibility for employees to manage their personal schedules.`; The passage ends with a reflection on the gap between connection tools and the art of connection; option F introduces a new topic (performance assessment) that is not directly tied to the preceding sentence, but it is not clearly ungrammatical or impossible. Option E (flexibility) also does not perfectly fit the concluding tone. Both options are somewhat tangential, so the current key is not clearly wrong.

### seven_select-sp-kaoyan-cjr8pq
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `1:Many digital minimalists report feeling more productive and less anxious after reducing screen time.`; suggested `6:Some experts warn that extreme digital detoxes could lead to social anxiety in face-to-face settings.`; Option B is not clearly wrong; it provides a plausible contrast to the preceding research finding and can lead into the balanced conclusion. Option G also fits but is not uniquely correct.

### seven_select-sp-kaoyan-gsf8jy
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `0:Those with limited access to technology or low digital literacy may find it even harder to catch up if the privileged few disconnect voluntarily.`; suggested `5:The movement has gained traction particularly among young professionals in urban areas.`; Both A and F are plausible; A directly addresses the digital divide, while F introduces privilege context for the next sentence.

### seven_select-sp-kaoyan-jjbjy6
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `3:Digital minimalism has been criticized for being too extreme and unrealistic in a hyper-connected world.`; suggested `1:Critics argue that digital minimalism is merely a privilege for those who can afford to disconnect, ignoring the realities of low-income workers.`; The passage ends on a positive note, but a preceding critical sentence (D) could serve as a counterpoint before the concluding statement, which then reframes the goal. Option B is also a criticism but introduces a different angle. Both D and B are plausible, and the flow is not clearly broken. Thus the current key is not clearly wrong.

### seven_select-sp-kaoyan-peak5j
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `5:The solution lies in redesigning our digital environments.`; suggested `1:B. Many people now check their phones over 150 times per day.`; Option F fits as a logical transition after the example, introducing a solution before the final paragraph. Option B also fits as a supporting statistic. Both are plausible.

### seven_select-sp-kaoyan-ry5zyv
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `0:Many people pride themselves on their ability to reply to emails while attending virtual meetings.`; suggested `6:Interestingly, younger generations tend to believe they are better at multitasking than older adults.`; Option A provides a concrete example of multitasking behavior that fits the context; the suggested G introduces a generational belief that is not directly supported by the surrounding text. Both are plausible, but A does not disrupt the flow.
- Blank 4: current `3:Some companies even encourage employees to respond to messages instantly across multiple platforms.`; suggested `0:Many people pride themselves on their ability to reply to emails while attending virtual meetings.`; Both Option D (company encouragement) and Option A (individual pride) are coherent examples of multitasking behavior leading to stress; neither is clearly wrong.

### seven_select-sp-kaoyan-tk7afb
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `6:Some advocates even recommend periodic 'digital detoxes' as a way to reset one's relationship with technology.`; suggested `0:The pressure to constantly stay connected can paradoxically increase anxiety rather than reduce it.`; Option G is a plausible concluding remark about digital detoxes, not necessarily disruptive; option A also fits as a counterpoint, making the choice unclear.

### seven_select-sp-中考-1aqvfm7
- Type: seven_select; exam: 中考; level: lv1
- Blank 1: current `1:Don't forget to wear warm clothes when you go outside.`; suggested `-1:`; The current option is a valid winter tip, and the passage structure allows it as a general suggestion before the list; no clearly better alternative exists.
- Blank 4: current `6:Many people get sick because they don't drink water.`; suggested `-1:`; The current option provides a reason to drink water, which loosely connects to the advice; no clearly better option is available.

### seven_select-sp-中考-1i85gx6
- Type: seven_select; exam: 中考; level: lv1
- Blank 4: current `3:After dinner, I helped my mother wash the dishes.`; suggested `0:Later that day, I went to the park with my friends.`; The passage does not mention dinner, so 'After dinner' is unsupported, but the suggested option also lacks clear contextual support; both are possible but not clearly correct.

### seven_select-sp-中考-1k688xk
- Type: seven_select; exam: 中考; level: lv1
- Blank 5: current `2:C. He remembered his grandfather’s kind smile.`; suggested `5:F. He decided to keep the box a secret from everyone.`; The current key 'He remembered his grandfather’s kind smile' is plausible as a reflective moment after finding the treasure, and the suggested option contradicts the story (he already showed the box). Neither is clearly correct, but the current key is not clearly wrong.

### seven_select-sp-中考-1rk43h0
- Type: seven_select; exam: 中考; level: lv1
- Blank 4: current `4:Later, my mother brought out a big cake and we sang birthday songs.`; suggested `1:B. After dinner, my parents took me to the cinema to watch a movie.`; Both E (cake) and B (cinema) could fit; the passage does not clearly rule out a cake scene before the diary entry, and the current key is not ungrammatical.

### seven_select-sp-中考-1ub0wev
- Type: seven_select; exam: 中考; level: lv1
- Blank 4: current `4:Everyone cheered for us after the race.`; suggested `5:We felt proud of what we had done together.`; Both 'cheered' and 'felt proud' are plausible after finishing third; the current key is acceptable but not uniquely best.
- Blank 5: current `5:We felt proud of what we had done together.`; suggested `4:Everyone cheered for us after the race.`; If blank 4 takes 'felt proud', then blank 5 could take 'cheered'; the current assignment is acceptable but the order could be swapped.

### seven_select-sp-中考-6li36c
- Type: seven_select; exam: 中考; level: lv1
- Blank 3: current `6:G. Making a card was not easy for me.`; suggested `5:F. I wrote a long poem on the back.`; The current key 'Making a card was not easy for me' can serve as a natural reflection after the drawing step, and the suggested poem could also fit, but the sequence is not strictly broken.
- Blank 5: current `5:F. I wrote a long poem on the back.`; suggested `6:G. Making a card was not easy for me.`; The current key 'I wrote a long poem on the back' could be placed earlier, but it is not clearly wrong here; the suggested reflective statement could also work, making both plausible.

### seven_select-sp-中考-lev21n
- Type: seven_select; exam: 中考; level: lv1
- Blank 4: current `0:Money can buy a big house, but it cannot buy a happy family.`; suggested `5:However, too much happiness may also cause problems.`; The current key (A) is a common saying about money vs. family, which can be seen as a relevant contrast to the idea that happiness isn't about money. The suggested F introduces a negative note that doesn't fit the positive flow. Both could be argued, so it's ambiguous.

### seven_select-sp-中考-nocq94
- Type: seven_select; exam: 中考; level: lv1
- Blank 3: current `4:Nodding your head sometimes is also helpful.`; suggested `3:Looking at someone shows you are honest.`; Both 'Nodding your head sometimes is also helpful' and 'Looking at someone shows you are honest' could logically follow 'smile and look the person in the eye', as nodding is a common accompanying gesture and looking is directly mentioned; the current key is not clearly wrong.

### seven_select-sp-高考-12ip10v
- Type: seven_select; exam: 高考; level: lv2
- Blank 2: current `3:However, silence can be a powerful tool in communication, allowing both parties to process thoughts and emotions.`; suggested `1:B. It is often said that silence speaks louder than words.`; Option D's 'However' may be redundant with the preceding sentence's 'However', but it still fits logically as a restatement. Option B also works as a transition. Both are acceptable.

### seven_select-sp-高考-1318vtw
- Type: seven_select; exam: 高考; level: lv2
- Blank 3: current `0:We often see boredom as something negative to avoid.`; suggested `3:Many people consider boredom a waste of time.`; Both A and D express negative views of boredom; A is not clearly wrong and the contrast with the following advice still works.

### seven_select-sp-高考-16ap3kn
- Type: seven_select; exam: 高考; level: lv2
- Blank 2: current `6:Actually, small talk is often the first step toward deeper relationships.`; suggested `1:It helps create a sense of belonging and reduces social anxiety.`; Both G and B can fit; G introduces deeper relationships which aligns with the example of turning strangers into familiar faces, while B offers a psychological benefit that also fits.
- Blank 4: current `1:It helps create a sense of belonging and reduces social anxiety.`; suggested `6:Actually, small talk is often the first step toward deeper relationships.`; Both B and G are plausible; B's belonging/anxiety reduction can follow the openness signal, and G's deeper relationships can also logically follow; the context does not clearly favor one over the other.

### seven_select-sp-高考-1gxrgid
- Type: seven_select; exam: 高考; level: lv2
- Blank 1: current `3:Instead of relying on willpower, they should design their environment for success.`; suggested `0:However, waiting for motivation often leads to delay and disappointment.`; Both options could fit: the current D introduces environment design as a strategy, which is not directly about micro-habits but still plausible; A contrasts motivation vs. action, which also fits the context. Neither is clearly wrong.
- Blank 4: current `0:However, waiting for motivation often leads to delay and disappointment.`; suggested `3:Instead of relying on willpower, they should design their environment for success.`; The current A about motivation is somewhat off-topic after 'reduces psychological barrier', but D about environment design is also not a perfect fit; both are possible, and the passage flow is not disrupted severely by either.

### seven_select-sp-高考-1mrvra4
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `5:They do not wait for motivation but rely on discipline.`; suggested `1:These small actions might seem unimportant at first glance.`; Both Option F (current) and Option B (suggested) are plausible in context; the current key is not clearly wrong.

### seven_select-sp-高考-1nr5l5f
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `4:Many teenagers struggle with fitting in and often give in to pressure.`; suggested `1:`; Option E is not ideal but still acceptable; the suggested option B is already used at blank 2, so it cannot be reused. No clearly better alternative exists.

### seven_select-sp-高考-1vn3uu7
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `4:In contrast, waiting for the perfect moment often leads to inaction.`; suggested `5:F. Many people fail because they try to do too much too soon.`; E is coherent as a contrast to the idea of making behavior easy; it warns against waiting for the perfect moment, which aligns with the theme of starting small. F also fits but is not clearly more correct.

### seven_select-sp-高考-gzclpr
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `3:Many people feel guilty when they turn down a request from a friend.`; suggested `6:Practicing this skill in low-stakes situations can build your confidence.`; The current key (D) about guilt with friends is not clearly incoherent; it could fit as a general observation before the concluding remarks. The suggested option (G) also fits but is not uniquely correct.

### seven_select-sp-高考-nroew3
- Type: seven_select; exam: 高考; level: lv2
- Blank 5: current `5:Instead of feeling guilty, you can offer an alternative way to help later.`; suggested `4:E. It is important to explain your reasons in detail every time you refuse.`; The passage ends with an example of polite refusal; F offers an alternative way to help, which can logically follow. E contradicts the idea of a simple refusal. Neither is clearly correct, but F is not incoherent.

### seven_select-sp-高考-pxulu3
- Type: seven_select; exam: 高考; level: lv2
- Blank 5: current `3:However, the real power lies in the compound effect of these small actions.`; suggested `2:C. Many people give up because they expect instant results.`; Option D fits as a concluding remark on the compound effect, and the passage does not clearly require a contrast about giving up; both options are plausible.

### seven_select-sp-高考-ra6a9y
- Type: seven_select; exam: 高考; level: lv2
- Blank 5: current `5:On the contrary, saying “yes” to everything often leads to burnout and resentment.`; suggested `4:Therefore, it is crucial to practice saying “no” in a respectful way.`; Both 'On the contrary' and 'Therefore' can work; the passage does not force a single logical connector.

### seven_select-sp-高考-siydko
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `0:A. Many people feel guilty when they refuse a request.`; suggested `3:D. This approach helps you focus on what truly matters.`; Option A is not clearly wrong; it can be seen as a natural extension of the previous sentence about boundaries improving relationships, as guilt is a common emotion when setting boundaries. Option D also fits, but the context does not decisively rule out A.

### seven_select-sp-高考-ussxyt
- Type: seven_select; exam: 高考; level: lv2
- Blank 5: current `1:People often feel awkward when starting a conversation.`; suggested `3:Some individuals prefer to remain silent in public places.`; Both B and D could fit: B's awkwardness is a plausible consequence of lacking small talk, while D offers a contrast; the passage's positive tone does not clearly rule out B.

### seven_select-sp-高考-xotdfc
- Type: seven_select; exam: 高考; level: lv2
- Blank 3: current `5:Silence is often misunderstood in modern society.`; suggested `2:Silence can also inspire creativity.`; The current key 'Silence is often misunderstood' could fit as a general statement before the positive example, but the suggested 'inspire creativity' also aligns with the meeting context. Both are plausible.


## Shape Issues

No structural issues found.

## AI Errors

- banked_cloze-bp-cet6-1kel89f: Expected ',' or ']' after array element in JSON at position 5421 (line 26 column 2)

## Notes

- Confirmed wrong requires two passes: pass 1 flags a blank, pass 2 confirms it.
- Ambiguous means the item should be reviewed by a human before changing the answer key.
- The script intentionally does not modify Supabase.
