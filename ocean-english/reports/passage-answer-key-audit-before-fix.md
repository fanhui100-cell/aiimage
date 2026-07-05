# Passage Answer Key Audit

Generated: 2026-06-17T13:27:23.515Z

Scope: active `banked_cloze` and `seven_select` rows. This report is read-only; no database rows were changed.

## Summary

| Type | Rows | Shape issue rows | Confirmed wrong rows | Confirmed wrong blanks | Ambiguous rows | AI error rows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| banked_cloze | 325 | 9 | 76 | 145 | 108 | 0 |
| seven_select | 544 | 0 | 317 | 553 | 262 | 0 |

## Confirmed Wrong

### banked_cloze-bp-cet4-110rpdd
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In modern society, we tend to view boredom as something entirely negative. However, recent studies suggest that moments of boredom can actually (1) creativity and problem-solving s
- Blank 5: current `2:defect` -> suggested `4:distraction`; confidence 0.9; 'defect' means flaw, but context requires something to be avoided; 'distraction' fits the idea of diverting attention.
- Blank 6: current `13:resist` -> suggested `0:stimulate`; confidence 0.95; 'resist innovation' contradicts the goal; 'stimulate' means to encourage, fitting the context.
- Blank 7: current `10:imaginative` -> suggested `13:resist`; confidence 0.95; 'imaginative' is an adjective but blank requires a verb after 'rather than'; 'resist' fits the meaning of fighting boredom with distractions.
- Blank 8: current `5:overlook` -> suggested `10:imaginative`; confidence 0.9; 'overlook' is a verb but blank requires an adjective parallel to 'original'; 'imaginative' fits the description.
- Blank 9: current `7:fruitful` -> suggested `5:overlook`; confidence 0.95; 'fruitful' is an adjective but blank requires a verb after 'should not'; 'overlook' means to ignore, fitting the meaning.
- Blank 10: current `4:distraction` -> suggested `7:fruitful`; confidence 0.9; 'distraction' is a noun but blank requires an adjective to modify 'thoughts'; 'fruitful' means productive, fitting the context.

### banked_cloze-bp-cet4-116vnxg
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: We often think of boredom as a negative state we should (1) at all costs. However, recent research suggests that boredom can actually be a (2) force for creativity. When our minds 
- Blank 10: current `6:complain` -> suggested `11:reject`; confidence 0.95; 'complain' does not fit the contrast with 'embrace'; 'reject' provides the required opposite meaning.

### banked_cloze-bp-cet4-14tcv0n
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world where everyone seems to be talking, the value of silence is often (1). However, silence can be a powerful tool in communication. When we pause before responding, we give
- Blank 8: current `10:resistance` -> suggested `8:honor`; confidence 0.9; 'Resistance' contradicts the idea of expressing sympathy or support; 'honor' fits as a respectful form of silence.

### banked_cloze-bp-cet4-15h4r3n
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that achieving success requires a major (1) or a single breakthrough moment. However, research in psychology suggests that it is actually the accumulation of sm
- Blank 9: current `3:difficulty` -> suggested `2:reduce`; confidence 0.95; The blank requires a verb to follow 'increase the', but 'difficulty' is a noun and does not fit grammatically or semantically. 'Reduce' is a verb that fits the context of gradually adjusting the habit's challenge.

### banked_cloze-bp-cet4-1765vkj
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In an age of constant digital (1), many people consider boredom as something to be avoided at all costs. However, recent studies suggest that letting the mind (2) may actually boos
- Blank 1: current `3:stimulation` -> suggested `13:distraction`; confidence 0.9; 'constant digital distraction' is a common collocation and fits the negative context of avoidance; 'stimulation' is positive and does not match.
- Blank 3: current `6:alternative` -> suggested `10:random`; confidence 0.85; When bored, the brain seeks 'random stimulation', not 'alternative stimulation'; 'alternative' implies a choice, which is less coherent.

### banked_cloze-bp-cet4-1aoh8u7
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In today's hyper-connected world, many people find themselves constantly (1) by notifications from their smartphones. This phenomenon has given (2) to a growing movement known as "
- Blank 8: current `14:focused` -> suggested `1:warn`; confidence 0.95; 'focused' is an adjective and cannot serve as a verb parallel to 'track'; 'warn' fits grammatically and semantically.
- Blank 9: current `10:connections` -> suggested `14:focused`; confidence 0.9; The blank requires an adjective parallel to 'creative'; 'connections' is a noun, while 'focused' fits the context of mental state.
- Blank 10: current `12:alert` -> suggested `10:connections`; confidence 0.95; 'Deeper alert' is not idiomatic; 'deeper connections' is the correct collocation for relationships.

### banked_cloze-bp-cet4-1atu1lp
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people consider boredom a negative state to be avoided at all costs. However, recent studies suggest that being bored can actually (1) creativity and problem-solving skills. W
- Blank 6: current `2:extinct` -> suggested `0:limited`; confidence 0.95; 'extinct' is unnatural for boredom; 'limited' is the correct collocation.

### banked_cloze-bp-cet4-1c767x
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In an age of constant stimulation, boredom has become a rare and often (1) experience. Many people, especially the young, feel an urgent need to fill every spare moment with digita
- Blank 1: current `12:avoided` -> suggested `2:ignored`; confidence 0.85; 'avoided' implies deliberate action, but the context describes boredom as overlooked or dismissed; 'ignored' fits the passive sense better.

### banked_cloze-bp-cet4-1cnd53h
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, the ability to appreciate silence is becoming a (1) skill. Many people find it difficult to sit quietly without checking their phones or turn
- Blank 10: current `9:answers` -> suggested `11:energy`; confidence 0.9; 'full of answers' is semantically odd and does not fit the positive, abstract tone; 'full of energy' is a natural collocation and matches the passage's theme.

### banked_cloze-bp-cet4-1cqu385
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: As cities expand, the need for (1) food sources becomes more urgent. Urban farming, which involves growing food within city limits, is gaining (2) as a solution. This practice not 
- Blank 4: current `6:limit` -> suggested `5:obstacle`; confidence 0.95; 'limit' is a verb; the blank requires a noun after 'a'. 'obstacle' fits grammatically and collocates with 'space is often a...'.

### banked_cloze-bp-cet4-1e6faps
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world that never stops talking, silence has become a (1) commodity. We are constantly surrounded by noise — from traffic, notifications, and endless conversations. Yet, it is 
- Blank 10: current `3:attention` -> suggested `10:possibilities`; confidence 0.9; 'presence of attention' is unidiomatic and does not fit the theme; 'possibilities' aligns with the idea of silence being full of potential.

### banked_cloze-bp-cet4-1i7nygy
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, silence has become a rare (1). Many people feel uneasy when there is no sound around them. They reach for their phones or turn on the TV to f
- Blank 3: current `8:recharge` -> suggested `3:refocus`; confidence 0.9; 'recharge' is not idiomatic with 'mind' in this context; 'refocus' fits the collocation 'allow the mind to refocus and reflect'.

### banked_cloze-bp-cet4-1k5467x
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, the value of silence is often (1) . We are surrounded by notifications, traffic, and endless conversations, leaving little room for quiet ref
- Blank 7: current `4:uncomfortable` -> suggested `14:significant`; confidence 1; 'Uncomfortable improvements' is semantically incoherent; 'significant improvements' is the correct collocation.
- Blank 8: current `6:tolerate` -> suggested `4:uncomfortable`; confidence 1; 'Feels tolerate' is ungrammatical; an adjective is required, and 'uncomfortable' fits perfectly.
- Blank 9: current `9:overwhelmed` -> suggested `1:ignore`; confidence 0.95; 'To overwhelmed' is ungrammatical; a base verb is needed, and 'ignore' fits the context of learning to disregard silence.
- Blank 10: current `5:reduced` -> suggested `9:overwhelmed`; confidence 0.95; 'Feel reduced by noise' is awkward and less idiomatic; 'feel overwhelmed by noise' is natural and common.

### banked_cloze-bp-cet4-1m74v0c
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world where everyone seems to be talking, the value of silence is often (1). However, silence can be a powerful tool in communication. When used (2), it allows people to think
- Blank 3: current `6:embarrassment` -> suggested `1:weakness`; confidence 0.95; 'sign of weakness' is a common collocation contrasting with respect; 'embarrassment' does not fit the context.

### banked_cloze-bp-cet4-1m809lv
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In an age of constant digital (1), it seems almost impossible to experience true boredom. However, research suggests that allowing our minds to wander can actually (2) creativity. 
- Blank 1: current `3:distraction` -> suggested `10:stimulation`; confidence 0.8; The passage contrasts boredom with constant digital input; 'stimulation' is the exact word used later and fits the idea of constant digital engagement better than 'distraction'.
- Blank 6: current `8:relaxed` -> suggested `1:relaxing`; confidence 0.95; After 'while', a present participle is needed to describe the ongoing action; 'relaxing' is correct, not the past participle 'relaxed'.

### banked_cloze-bp-cet4-1nwl4ir
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Modern life is filled with conveniences that save time and effort. However, these conveniences often come with a hidden (1) that we fail to notice. Take single-use plastic items, f
- Blank 7: current `3:difference` -> suggested `7:urgent`; confidence 0.95; 'take difference action' is ungrammatical; 'take urgent action' is the correct collocation.
- Blank 8: current `1:scale` -> suggested `3:difference`; confidence 0.95; 'make a scale' is not idiomatic; 'make a difference' is the standard phrase.
- Blank 9: current `4:essential` -> suggested `1:scale`; confidence 0.95; 'at a larger essential' is ungrammatical; 'at a larger scale' is the correct collocation.
- Blank 10: current `2:benefit` -> suggested `4:essential`; confidence 0.95; 'it is benefit' is ungrammatical (needs adjective); 'it is essential' fits meaning and grammar.

### banked_cloze-bp-cet4-1secwj6
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, the ability to sit in silence has become a rare (1). Many people feel (2) when there is no sound, as if silence is something to be (3). Howev
- Blank 9: current `9:embrace` -> suggested `10:improve`; confidence 0.9; 'Embrace your mood' is not idiomatic; 'improve your mood' is correct.
- Blank 10: current `13:reduce` -> suggested `9:embrace`; confidence 0.95; 'Reduce a few moments of silence' is semantically odd; 'embrace' fits the intended meaning.

### banked_cloze-bp-cet4-1u2ckm8
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, the value of silence is often (1) . People rush from one activity to another, rarely taking a moment to simply be still. However, silence can
- Blank 3: current `6:engage` -> suggested `1:distract`; confidence 0.95; 'Engage ourselves from' is ungrammatical; 'distract ourselves from' is correct and fits the context.
- Blank 10: current `4:truly` -> suggested `14:embrace`; confidence 0.98; 'To truly' is an adverb and cannot follow 'to' as an infinitive; 'to embrace' is a verb and fits grammatically and semantically.

### banked_cloze-bp-cet4-1v2zmgv
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In modern society, the way we communicate has undergone a dramatic (1). With the rise of social media, people now have more (2) to connect with others than ever before. However, th
- Blank 5: current `14:sustain` -> suggested `12:interrupt`; confidence 0.95; The phrase 'hard to sustain a conversation' is unnatural; 'interrupt' fits the context of checking phones during conversation.
- Blank 10: current `1:decline` -> suggested `10:barrier`; confidence 0.95; 'Decline' does not fit as a noun meaning obstacle; 'barrier' correctly contrasts with 'tool' and means something that blocks connection.

### banked_cloze-bp-cet4-1xye193
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In modern society, we are constantly surrounded by digital devices that keep us (1) engaged. However, a growing number of experts argue that boredom, often (2) as a negative state,
- Blank 1: current `4:constantly` -> suggested `14:encouraged`; confidence 0.95; 'keep us' requires an adjective or past participle; 'constantly' is an adverb and ungrammatical.
- Blank 10: current `3:resist` -> suggested `0:eliminate`; confidence 0.85; 'resist' is not opposite to 'embrace'; 'eliminate' provides the required contrast.

### banked_cloze-bp-cet4-56ce3o
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that achieving big goals requires dramatic changes, but research suggests that small, consistent habits can be (1) more powerful over time. For example, reading
- Blank 1: current `11:eventually` -> suggested `4:significant`; confidence 1; 'eventually' is an adverb and cannot modify the adjective phrase 'more powerful'; an adjective like 'significant' is grammatically required.

### banked_cloze-bp-cet4-6d6zmz
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that success requires a single, dramatic (1) . However, research in psychology suggests that it is actually small, consistent habits that (2) our lives over tim
- Blank 6: current `5:challenges` -> suggested `14:ignores`; confidence 0.9; 'challenges' implies confrontation, but the context requires a verb meaning 'disregards' or 'goes against'; 'ignores' fits better.

### banked_cloze-bp-cet4-97omvw
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that success requires dramatic changes, but research suggests that small, consistent habits can be surprisingly (1). These tiny actions, often too small to seem
- Blank 2: current `3:achievement` -> suggested `0:ignore`; confidence 0.9; 'achievement' is a noun; after 'to seem' a verb is needed. 'ignore' fits grammatically and contextually.
- Blank 3: current `8:resistance` -> suggested `3:achievement`; confidence 0.95; 'resistance' does not collocate with 'feel like a big'; 'achievement' is natural and fits the context.
- Blank 4: current `6:design` -> suggested `8:resistance`; confidence 0.95; 'mental design' is not idiomatic; 'mental resistance' correctly conveys reluctance to begin.
- Blank 5: current `14:cabinet` -> suggested `6:design`; confidence 0.95; 'cabinet' is a specific object; 'design of your environment' is the intended meaning.
- Blank 6: current `11:undermine` -> suggested `14:cabinet`; confidence 0.95; A noun is needed after 'hard-to-reach'; 'cabinet' fits as a storage place, while 'undermine' is a verb.
- Blank 7: current `1:accomplishment` -> suggested `11:undermine`; confidence 0.95; A verb parallel to 'support' is required; 'undermine' provides the needed contrast.
- Blank 8: current `12:build` -> suggested `1:accomplishment`; confidence 0.95; 'sense of build' is ungrammatical; 'sense of accomplishment' is a standard collocation.
- Blank 10: current `0:ignore` -> suggested `9:compound`; confidence 0.95; 'ignore into' is nonsensical; 'compound' means accumulate and fits the context.

### banked_cloze-bp-cet4-97w8l8
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that success is the result of a single, dramatic event. However, research suggests that it is actually the product of small, daily (1) . These repeated actions,
- Blank 5: current `4:immediate` -> suggested `1:adjusting`; confidence 0.95; The preposition 'by' requires a gerund; 'immediate' is an adjective and ungrammatical here.

### banked_cloze-bp-cet4-abb8sp
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Social media has (1) transformed the way people communicate in the digital age. Platforms like Twitter and Instagram allow users to share their thoughts (2) with a global audience.
- Blank 2: current `9:quality` -> suggested `1:instantly`; confidence 0.95; Adverb needed to modify 'share'; 'quality' is a noun and ungrammatical.
- Blank 3: current `2:reduce` -> suggested `9:quality`; confidence 0.95; Noun needed after 'the'; 'reduce' is a verb and ungrammatical.
- Blank 4: current `3:weaken` -> suggested `2:reduce`; confidence 0.9; 'Reduce face-to-face interactions' is more natural than 'weaken'.
- Blank 5: current `13:enable` -> suggested `3:weaken`; confidence 0.95; Negative context requires 'weaken'; 'enable' is opposite in meaning.
- Blank 6: current `0:speed` -> suggested `13:enable`; confidence 0.95; Verb needed; 'speed' is a noun and ungrammatical.
- Blank 7: current `6:distraction` -> suggested `0:speed`; confidence 0.95; Noun needed; 'distraction' does not fit the context of spreading information.
- Blank 8: current `8:address` -> suggested `6:distraction`; confidence 0.95; Noun needed after 'leads to'; 'address' is a verb and ungrammatical.
- Blank 9: current `4:convenience` -> suggested `8:address`; confidence 0.95; Verb needed after 'To'; 'convenience' is a noun and ungrammatical.
- Blank 10: current `1:instantly` -> suggested `4:convenience`; confidence 0.95; Noun needed after 'great'; 'instantly' is an adverb and ungrammatical.

### banked_cloze-bp-cet4-aclnqz
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that achieving big goals requires dramatic changes, but research suggests that small, consistent habits can be more (1). Instead of trying to transform your lif
- Blank 2: current `4:accumulate` -> suggested `5:grow`; confidence 0.9; 'accumulate' is transitive and needs an object; 'grow into' is a natural collocation meaning develop into
- Blank 6: current `3:arrangement` -> suggested `6:strategy`; confidence 0.85; 'arrangement' is too vague; 'strategy' fits the context of a planned approach to remove decision-making

### banked_cloze-bp-cet4-cr9a8b
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, silence has become a rare (1). Many people feel uncomfortable when there is no sound, so they fill every moment with music, conversation, or 
- Blank 9: current `11:harvest` -> suggested `13:enhance`; confidence 0.9; 'Harvest the power' is not idiomatic; 'enhance' fits the context of using silence's benefits.

### banked_cloze-bp-cet4-ei6m9d
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many students consider procrastination a bad habit, but a new study suggests it may not be entirely (1). Researchers found that those who delay tasks often end up with more (2) sol
- Blank 8: current `13:unconscious` -> suggested `10:avoidance`; confidence 0.95; The blank requires a noun to parallel 'productive delay'; 'unconscious' is an adjective and does not fit grammatically or semantically.

### banked_cloze-bp-cet4-jb65ft
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that achieving big goals requires dramatic changes, but research suggests that small, consistent habits can be surprisingly (1). Instead of trying to transform 
- Blank 8: current `14:combine` -> suggested `5:accumulate`; confidence 0.9; 'combine into' is not idiomatic; 'accumulate into' fits the context of small actions building up over time.

### banked_cloze-bp-cet4-jbpnyp
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In today's world, the rapid development of technology has brought about significant changes to our daily lives. One of the most noticeable (1) is the way we communicate. People now
- Blank 1: current `7:aspect` -> suggested `2:reduction`; confidence 0.9; 'aspect' does not fit the context of noticeable changes; 'reduction' (in face-to-face interaction) is the logical consequence of technology shift.

### banked_cloze-bp-cet4-jj55jf
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world full of constant noise, the (1) of silence is often overlooked. Many people feel uncomfortable when there is no sound, so they tend to (2) the quiet with music or conver
- Blank 7: current `0:practice` -> suggested `10:respect`; confidence 0.9; 'practice silence' is not idiomatic; 'respect silence' fits the context of showing respect through silence.

### banked_cloze-bp-cet4-kxwg7x
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people underestimate the value of small talk, viewing it as a (1) waste of time. However, research shows that brief conversations with strangers can significantly (2) our mood
- Blank 1: current `14:mere` -> suggested `0:waste`; confidence 0.95; 'mere' is an adjective, but the blank requires a noun after 'a'; 'waste' is the correct noun.
- Blank 5: current `5:avoid` -> suggested `1:benefit`; confidence 0.9; 'avoid from' is ungrammatical; 'benefit from' is the correct collocation and fits the context.

### banked_cloze-bp-cet4-lxi6sl
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In an age of constant digital stimulation, the feeling of boredom has become something we try to (1) at all costs. Yet recent studies suggest that boredom is not merely a negative 
- Blank 2: current `8:eliminated` -> suggested `5:embraced`; confidence 0.9; 'Eliminated' is too strong and not idiomatic; 'embraced' fits the contrast with 'avoid' and the positive reframing.
- Blank 5: current `14:regulation` -> suggested `10:described`; confidence 1; 'Regulation' is a noun, not a past participle; 'described' is grammatically correct and fits the meaning.

### banked_cloze-bp-cet4-s1784g
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, the value of silence is often (1). Many people feel uneasy when there is no sound around them. They tend to (2) their lives with music, podca
- Blank 5: current `6:relationship` -> suggested `10:isolation`; confidence 0.95; 'Complete isolation' is a natural collocation for working alone; 'relationship' does not fit.
- Blank 6: current `1:aware` -> suggested `6:relationship`; confidence 0.9; Blank needs a noun after 'improve our'; 'aware' is an adjective.
- Blank 7: current `8:connection` -> suggested `1:aware`; confidence 0.9; Blank needs an adjective after 'become more'; 'connection' is a noun.
- Blank 8: current `11:significant` -> suggested `8:connection`; confidence 0.9; Blank needs a noun after 'trust and'; 'significant' is an adjective.
- Blank 9: current `12:embrace` -> suggested `11:significant`; confidence 0.95; Blank needs an adjective before 'difference'; 'embrace' is a verb.
- Blank 10: current `4:ignore` -> suggested `12:embrace`; confidence 0.95; Context promotes valuing silence; 'embrace' fits, 'ignore' is opposite.

### banked_cloze-bp-cet4-y9j5ra
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people find small talk (1) because they worry about running out of things to say. However, mastering this skill can greatly (2) your social and professional life. The key is t
- Blank 10: current `5:habit` -> suggested `1:strategy`; confidence 0.85; 'habit' does not naturally become natural; 'strategy' or 'skill' is needed, but 'strategy' is the only available option that fits.

### banked_cloze-bp-cet6-11lbg35
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices have become an (1) part of daily life, the concept of a “digital detox” has gained remarkable popularity. Many people, feeling overwhelmed by consta
- Blank 3: current `7:complicated` -> suggested `13:undermined`; confidence 0.9; 'complicated' is an adjective, but the blank requires a past participle passive verb; 'undermined' fits the meaning of effectiveness being weakened by reliance.
- Blank 5: current `13:undermined` -> suggested `7:complicated`; confidence 0.85; 'undermined' is already used in blank 3; here the attempt is made more difficult or complex, so 'complicated' fits better.

### banked_cloze-bp-cet6-13cptaw
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: Urban green spaces are often celebrated for their aesthetic appeal, but their role in mitigating the effects of climate change is frequently (1). Recent studies have shown that par
- Blank 2: current `4:existence` -> suggested `3:degradation`; confidence 0.9; 'existence' is too vague; the threat from urbanization and budget cuts specifically implies decline in quality, i.e., 'degradation'.

### banked_cloze-bp-cet6-13outwr
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices are (1) in every aspect of our lives, a growing number of people are embracing digital minimalism—a deliberate reduction of screen time. However, th
- Blank 4: current `3:emphasize` -> suggested `7:emphasized`; confidence 0.95; Past tense required for consistency with surrounding narrative; 'emphasize' is ungrammatical.

### banked_cloze-bp-cet6-16y5vqh
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age of constant connectivity, many people are embracing a lifestyle known as digital minimalism. This philosophy encourages individuals to (1) their use of technology, focusi
- Blank 2: current `1:pitfall` -> suggested `12:confer`; confidence 0.95; 'pitfall' is a noun; blank requires a verb meaning 'give' or 'provide' value. 'confer' fits collocation 'confer value'.
- Blank 4: current `10:add` -> suggested `1:pitfall`; confidence 0.9; 'add' is a verb; blank requires a noun as subject. 'pitfall' fits context of challenges.
- Blank 5: current `9:anxiety` -> suggested `13:curb`; confidence 0.95; 'anxiety' is a noun; blank requires a verb after 'might'. 'curb the urge' is a common collocation.
- Blank 6: current `12:confer` -> suggested `9:anxiety`; confidence 0.95; 'confer' is a verb; blank requires a noun after 'a sense of'. 'anxiety' fits emotional context.

### banked_cloze-bp-cet6-1btp2m4
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: Procrastination, often (1) as a sign of laziness, is actually a complex psychological phenomenon. Recent studies suggest that it is not about poor time management but rather an emo
- Blank 2: current `5:regulation` -> suggested `4:cope`; confidence 0.9; 'cope mechanism' is a standard collocation; 'regulation mechanism' is awkward and less idiomatic

### banked_cloze-bp-cet6-1d3ne67
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid advancement of artificial intelligence has (1) a profound impact on various industries, from healthcare to finance. However, the (2) of this technology also raises ethica
- Blank 1: current `11:had` -> suggested `6:impact`; confidence 0.95; 'has had a profound impact' is ungrammatical because 'had' is past participle but the present perfect requires 'has had' as a unit; the blank needs a noun, and 'impact' fits perfectly.

### banked_cloze-bp-cet6-1d4umg2
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In today’s fast-paced world, many people pride themselves on their ability to multitask. However, recent cognitive research has (1) this widespread belief, suggesting that what we 
- Blank 10: current `8:foster` -> suggested `1:enhance`; confidence 0.7; 'foster a balance' is not idiomatic; 'enhance a balance' is also weak, but 'foster' is particularly unnatural. A better fit would be 'strike' or 'achieve', but among options, 'enhance' is more acceptable than 'foster'.

### banked_cloze-bp-cet6-1ixyy0b
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where digital devices clamor for our attention, many have turned to digital minimalism as a solution. This philosophy advocates reducing screen time to enhance mental wel
- Blank 2: current `13:contradictory` -> suggested `9:pronounced`; confidence 0.9; 'contradictory sense of social isolation' is semantically odd; context requires an adjective meaning 'strong' or 'noticeable'.

### banked_cloze-bp-cet6-1j637du
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era of information explosion, the ability to (1) reliable sources from unreliable ones has become a crucial skill. Many people, however, are (2) by the sheer volume of data a
- Blank 6: current `14:identify` -> suggested `0:distinguish`; confidence 0.9; Algorithms are used to tell apart fake news from real news, not just recognize it; 'distinguish' fits the contrastive context.

### banked_cloze-bp-cet6-1jzx21x
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In today’s fast-paced world, the desire for convenience often (1) our daily decisions. We choose ready-made meals over home cooking, and digital communication over face-to-face int
- Blank 2: current `11:overlook` -> suggested `14:acknowledge`; confidence 0.95; 'Seldom overlook' means often notice, opposite of intended meaning; 'acknowledge' fits the context of not admitting the cost.

### banked_cloze-bp-cet6-1lcyqvs
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where screens dominate our daily lives, the concept of a digital detox has gained considerable (1). However, the irony is that many people find it (2) to truly disconnect
- Blank 7: current `10:engage` -> suggested `0:challenge`; confidence 0.9; 'engage' as a bare infinitive after 'such as' is ungrammatical; no gerund form is available, but 'challenge' is also ungrammatical. The current key is clearly wrong.

### banked_cloze-bp-cet6-1mj7xtk
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rise of remote work has given birth to a new breed of professionals: digital nomads. These individuals (1) the freedom to work from anywhere, from beachside cafes to mountain c
- Blank 5: current `8:spread` -> suggested `12:flaws`; confidence 0.95; 'spread' is ungrammatical as a noun here; 'flaws' correctly means drawbacks.

### banked_cloze-bp-cet6-1nv5sy0
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In recent years, the concept of digital minimalism has gained considerable (1) among tech-savvy individuals. Advocates argue that by deliberately reducing screen time, people can a
- Blank 3: current `11:isolating` -> suggested `1:fragmented`; confidence 0.85; 'isolating effect' is grammatically possible but 'fragmented' better describes the breakdown of relationships, which is the intended meaning; the passage later discusses loneliness as a result, not the effect itself.

### banked_cloze-bp-cet6-1sa02t9
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid advancement of artificial intelligence has (1) a profound impact on various industries, from healthcare to finance. However, this progress also raises (2) questions about
- Blank 1: current `6:exerted` -> suggested `2:generate`; confidence 0.95; 'exerted a profound impact' is not idiomatic; 'generate a profound impact' is the correct collocation.

### banked_cloze-bp-cet6-1suaofo
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The ocean, often (1) as a vast and unchanging expanse, is in fact a highly dynamic system. Its currents, driven by wind and temperature differences, (2) heat around the globe, regu
- Blank 2: current `9:transfer` -> suggested `8:driven`; confidence 0.9; 'transfer heat' is possible but the sentence requires a passive verb form; 'driven' fits the collocation 'currents driven by wind'.

### banked_cloze-bp-cet6-7agls2
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where screens dominate our daily lives, the concept of a digital detox has gained considerable (1). Yet, for many, the idea of completely disconnecting from the online wo
- Blank 2: current `8:disturbing` -> suggested `13:feasible`; confidence 0.9; 'disturbing' does not fit the parallel structure 'not only impractical but also'; 'feasible' is the correct antonym of impractical.
- Blank 4: current `3:reduction` -> suggested `6:boost`; confidence 0.95; A break from devices improves mood and sleep, so 'boost' (increase) is correct; 'reduction' would imply worsening.
- Blank 8: current `4:challenge` -> suggested `5:speculate`; confidence 0.85; The findings suggest or indicate (speculate) that the assumption is wrong, not challenge it; 'challenge' would imply the findings oppose the assumption, which is not the intended meaning.

### banked_cloze-bp-cet6-836h1s
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where smartphones have become an (1) part of daily life, the concept of a digital detox has gained considerable traction. Many individuals, feeling overwhelmed by constan
- Blank 4: current `1:updates` -> suggested `13:obstacle`; confidence 0.85; 'updates' does not fit the context of requiring frequent attention; 'obstacle' is the only noun in the bank that logically requires monitoring.

### banked_cloze-bp-cet6-83l5o4
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices have become an (1) part of daily life, the concept of a “digital detox” has gained considerable traction. Many people, feeling overwhelmed by consta
- Blank 10: current `1:consciously` -> suggested `1:consciously`; confidence 1; Blank requires a verb; 'consciously' is an adverb and cannot fill the slot grammatically.

### banked_cloze-bp-cet6-c55pul
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: Urban green spaces, such as parks and community gardens, have become a crucial (1) of modern city planning. They not only (2) the aesthetic appeal of a city but also provide essent
- Blank 8: current `9:intensify` -> suggested `1:reduce`; confidence 0.8; 'intensify efforts' is unidiomatic; 'reduce' does not fit context; no suitable option in bank, but current key is clearly wrong.

### banked_cloze-bp-cet6-fdg57b
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The sharing economy, a model based on peer-to-peer access to goods and services, has (1) transformed various industries. Unlike traditional business models that emphasize ownership
- Blank 5: current `3:stable` -> suggested `12:temporary`; confidence 0.9; 'stable employment benefits' contradicts the context of gig workers lacking security; 'temporary' fits the precarious nature of such work.

### banked_cloze-bp-cet6-fyobw8
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age of constant connectivity, the concept of digital minimalism has gained considerable (1). Advocates argue that reducing screen time can (2) mental health and boost product
- Blank 5: current `13:supplemented` -> suggested `4:pronounced`; confidence 1; 'supplemented' is a verb form; blank needs an adjective like 'pronounced' to describe the feeling.
- Blank 6: current `6:severe` -> suggested `13:supplemented`; confidence 1; 'severe' is an adjective; blank requires a past participle for passive construction 'be supplemented with'.
- Blank 8: current `9:underscore` -> suggested `7:cold turkey`; confidence 1; 'underscore' is a verb; blank needs an adverbial phrase meaning 'abruptly', which 'cold turkey' provides.
- Blank 9: current `10:overlook` -> suggested `9:underscore`; confidence 1; 'overlook' means the opposite; blank needs a verb meaning 'emphasize', which 'underscore' fits.
- Blank 10: current `14:disrupt` -> suggested `10:overlook`; confidence 1; 'disrupt' does not fit the context; blank needs a verb meaning 'fail to consider', which 'overlook' provides.

### banked_cloze-bp-cet6-g7kmig
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where information flows at unprecedented speed, the phenomenon of the digital echo chamber has become a growing (1) . Social media algorithms, designed to maximize user e
- Blank 3: current `8:narrow` -> suggested `0:outcome`; confidence 0.95; 'narrow of perspectives' is ungrammatical; 'outcome' fits the context of a dangerous result.
- Blank 4: current `11:immune` -> suggested `7:tolerant`; confidence 0.9; 'immune to viewpoints' is semantically odd; 'tolerant of' is the correct collocation for accepting differing views.

### banked_cloze-bp-cet6-i7kf9s
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In our modern world, convenience is often hailed as a supreme virtue. We have developed a (1) for instant gratification, from fast food to same-day delivery. However, this pursuit 
- Blank 5: current `3:abundance` -> suggested `4:scarcity`; confidence 0.95; The context 'lose the ___ of waiting' requires a noun meaning rarity or lack; 'abundance' contradicts the meaning, while 'scarcity' fits perfectly.
- Blank 6: current `9:content` -> suggested `3:abundance`; confidence 0.98; The phrase 'the ___ of choice' needs a noun meaning large quantity; 'abundance' fits, while 'content' is an adjective and does not fit grammatically or semantically.
- Blank 7: current `1:counteract` -> suggested `6:deprived`; confidence 0.95; The blank follows 'feel less' and requires an adjective; 'deprived' fits the context of dissatisfaction, while 'counteract' is a verb and does not fit.
- Blank 8: current `8:ecological` -> suggested `1:counteract`; confidence 0.98; The phrase 'To ___ this trend' needs a verb meaning oppose or reverse; 'counteract' fits, while 'ecological' is an adjective and does not work grammatically.
- Blank 9: current `2:cultivate` -> suggested `8:ecological`; confidence 0.98; The blank modifies 'footprint' and requires an adjective; 'ecological' fits the environmental context, while 'cultivate' is a verb and does not fit.
- Blank 10: current `13:impulse` -> suggested `2:cultivate`; confidence 0.98; The phrase 'help us ___ a more balanced lifestyle' needs a verb meaning develop or foster; 'cultivate' fits, while 'impulse' is a noun and does not work grammatically.

### banked_cloze-bp-cet6-id0vi
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where every moment can be captured and stored, we find ourselves facing a curious (1) . The very tools designed to preserve our memories may actually be (2) our ability t
- Blank 6: current `3:completion` -> suggested `13:fabric`; confidence 0.8; 'sense of completion' is unidiomatic here; the context requires a word meaning 'false sense that remembering is done', and 'fabric' (as in 'fabric of experience') is the only plausible option in the bank.

### banked_cloze-bp-cet6-ieu49r
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid development of artificial intelligence has (1) a profound impact on various industries. Many experts believe that the (2) of human labor by machines is inevitable, yet th
- Blank 4: current `1:capacity` -> suggested `7:limited`; confidence 0.95; After 'is still', an adjective is required; 'capacity' is a noun.
- Blank 5: current `9:challenged` -> suggested `2:creativity`; confidence 0.95; 'Lacks the' needs a noun; 'challenged' is a verb.
- Blank 6: current `0:prevalence` -> suggested `9:challenged`; confidence 0.95; Present perfect needs past participle; 'prevalence' is a noun.
- Blank 7: current `3:formulate` -> suggested `0:prevalence`; confidence 0.95; 'The' requires a noun; 'formulate' is a verb.
- Blank 8: current `12:concern` -> suggested `3:formulate`; confidence 0.95; After 'to', base verb needed; 'concern' is a noun.
- Blank 9: current `14:exacerbate` -> suggested `12:concern`; confidence 0.95; 'A key' requires a noun; 'exacerbate' is a verb.
- Blank 10: current `8:enhanced` -> suggested `14:exacerbate`; confidence 0.95; After 'may', base verb needed; 'enhanced' is past participle.

### banked_cloze-bp-cet6-j07w1s
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid advancement of artificial intelligence has (1) a profound impact on various industries, from healthcare to finance. However, this progress also brings (2) challenges that
- Blank 1: current `13:exerted` -> suggested `3:significant`; confidence 0.9; 'exerted a profound impact' is unidiomatic; the structure requires an adjective before 'impact'.
- Blank 7: current `9:advocate` -> suggested `12:worry`; confidence 0.85; 'Advocate' requires an object or 'that' clause; the structure 'advocate that companies should' is awkward. 'Worry' or 'fear' fit better.

### banked_cloze-bp-cet6-j2o1mh
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where digital devices are (1) integrated into every aspect of our lives, the concept of a “digital detox” has gained considerable traction. Many people, feeling (2) by co
- Blank 6: current `2:accessible` -> suggested `11:addicted`; confidence 0.9; 'remain accessible' is unidiomatic and weak in context; 'remain addicted' directly supports the idea of social pressure and 'social suicide'.

### banked_cloze-bp-cet6-j68n7f
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where screens dominate our daily lives, the concept of a digital detox has gained considerable (1). Many people feel an (2) urge to disconnect from their devices, hoping 
- Blank 10: current `1:alien` -> suggested `5:familiar`; confidence 0.95; 'feel alien' is ungrammatical without a preposition; 'familiar' provides the intended contrast and is grammatically correct.

### banked_cloze-bp-cet6-l23fny
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices dominate our daily routines, the concept of a “digital detox” has gained considerable traction. Many people, feeling overwhelmed by constant notific
- Blank 10: current `6:masters` -> suggested `10:distraction`; confidence 0.95; 'masters' does not fit the contrast 'aids rather than ...'; 'distraction' is the correct antonym in context.

### banked_cloze-bp-cet6-p56twp
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where screens dominate our daily lives, the concept of a “digital detox” has gained remarkable (1). Many people, feeling overwhelmed by constant notifications, are now se
- Blank 9: current `7:resists` -> suggested `10:fragile`; confidence 0.95; 'Resists' is a verb and does not fit the parallel adjective structure 'complex and ___'; 'fragile' is an adjective that fits grammatically and semantically.

### banked_cloze-bp-cet6-pzanzn
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid integration of technology into classrooms has brought about a significant (1) in teaching methods, yet it has also exposed a troubling (2) between students with access to
- Blank 8: current `3:cultivation` -> suggested `8:neglect`; confidence 0.95; Context requires a negative term like 'neglect' to align with the digital divide's harmful effects; 'cultivation' is semantically opposite.

### banked_cloze-bp-cet6-qvmnje
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices are omnipresent, the concept of a “digital detox” has gained considerable (1) . Many people feel a constant urge to check their phones, a behavior t
- Blank 9: current `0:acknowledging` -> suggested `7:foster`; confidence 0.9; 'acknowledging' is ungrammatical as it does not parallel 'cultivating' in structure and meaning; 'foster' is the correct verb form and fits the sense of promoting value.

### banked_cloze-bp-cet6-s53nw9
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time to improve mental well-being. However, this practice m
- Blank 4: current `4:complain` -> suggested `12:anxiety`; confidence 0.95; 'complain' is a verb but the blank requires a noun as object of 'to'; 'anxiety' fits grammatically and collocates with 'sense of'.

### banked_cloze-bp-cet6-slldok
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where screens dominate our daily lives, the concept of a digital detox has gained considerable (1). Many people, feeling overwhelmed by constant notifications, decide to 
- Blank 4: current `14:paradoxical` -> suggested `6:negative`; confidence 0.95; 'paradoxical' does not collocate with 'sense of anxiety'; the context describes a direct negative experience, not a paradox.

### banked_cloze-bp-cet6-t3ysmy
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: As cities continue to expand, the (1) of green spaces has become a pressing concern for urban planners. These areas not only provide (2) benefits but also contribute to mental well
- Blank 7: current `11:decorative` -> suggested `7:temporary`; confidence 0.85; 'decorative' does not contrast with 'functional' as intended; 'temporary' fits the contrast and context better.

### banked_cloze-bp-cet6-urn9kj
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The promise of digital agriculture has long been hailed as a revolution for food security. However, a growing body of evidence suggests that the (1) of data-driven farming may be w
- Blank 6: current `12:equity` -> suggested `14:inequality`; confidence 0.9; 'equity' (fairness) is a positive concept, but the context of 'imbalance' and 'autonomy' clearly calls for a negative term like 'inequality'.

### banked_cloze-bp-cet6-w3i3c2
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where information flows freely, the phenomenon of the digital echo chamber has become a (1) concern. Social media platforms, driven by algorithms, often (2) users with co
- Blank 8: current `2:philosophical` -> suggested `8:verify`; confidence 1; 'philosophical' is an adjective, but blank requires a verb after 'to'; 'verify' fits grammatically and semantically.
- Blank 9: current `8:verify` -> suggested `2:philosophical`; confidence 1; 'verify' is a verb, but blank requires an adjective parallel to 'technical'; 'philosophical' fits grammatically and semantically.

### banked_cloze-bp-cet6-xijkh0
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In recent years, the concept of digital minimalism has gained considerable (1) among tech-savvy individuals. Proponents argue that by deliberately reducing screen time, one can (2)
- Blank 3: current `7:mask` -> suggested `2:exacerbate`; confidence 0.95; 'mask' contradicts the context; research suggests the movement worsens the divide, not hides it.

### banked_cloze-bp-cet6-xn3psd
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era defined by instant communication, we find ourselves grappling with a peculiar (1) . While technology has enabled us to connect with people across the globe, it has simult
- Blank 5: current `1:discriminating` -> suggested `7:superficial`; confidence 0.9; 'Discriminating' is positive and does not fit the critical tone; 'superficial' contrasts with deep conversations.
- Blank 10: current `11:availability` -> suggested `5:distraction`; confidence 0.9; 'Availability' is neutral and does not contrast with 'presence' as strongly as 'distraction' does.

### banked_cloze-bp-cet6-ybzmg3
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where smartphones have become an (1) extension of our hands, the concept of a digital detox has gained remarkable traction. Many people, feeling overwhelmed by constant n
- Blank 5: current `9:invisible` -> suggested `6:norms`; confidence 0.95; 'social invisible' is ungrammatical; 'social norms' is the correct collocation.
- Blank 7: current `6:norms` -> suggested `3:monitoring`; confidence 0.95; 'act of norms' is ungrammatical; 'act of monitoring' is correct.
- Blank 9: current `10:isolation` -> suggested `0:instability`; confidence 0.9; 'job isolation' is not a standard collocation; 'job instability' is common.

### banked_cloze-bp-cet6-zmnl01
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: Sleep, often taken for granted, is far more than a period of rest. It is a complex biological process that (1) our physical and mental health. In modern society, however, chronic s
- Blank 5: current `4:err` -> suggested `2:ignore`; confidence 0.9; 'err' cannot be followed by 'to believe' in standard English; 'ignore' fits the context of people wrongly thinking they can function on minimal sleep.

### seven_select-sp-kaoyan-10pripf
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a lifestyle choice aimed at reducing screen time and reclaiming focus. (1) Yet beneath this seemingly virtuous trend lies
- Blank 3: current `3:Yet the very structure of digital minimalism can paradoxically create new forms of isolation.` -> suggested `5:Without these moments, team cohesion may suffer, and innovation can become more incremental.`; confidence 0.85; Blank 3 follows a sentence about loss of informal exchanges sparking creativity and trust; F directly continues that idea, while D introduces a new paradox that disrupts the local flow.
- Blank 4: current `5:Without these moments, team cohesion may suffer, and innovation can become more incremental.` -> suggested `3:Yet the very structure of digital minimalism can paradoxically create new forms of isolation.`; confidence 0.8; Blank 4 follows the sentence about over-censoring online presence; D's paradox about isolation fits better as a broader consequence, while F is too specific to workplace moments already covered.

### seven_select-sp-kaoyan-10zdhmd
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of ourselves, the boundary between being connected and being overloaded has grown increasingly thin. (1) However, a growing b
- Blank 5: current `0:Many people pride themselves on being able to multitask efficiently across various apps and platforms.` -> suggested `2:Studies indicate that frequent task-switching can reduce overall productivity by as much as 40%.`; confidence 0.9; The passage builds a critical view of digital distractions and ends with a recommendation for deep work. Option A about pride in multitasking contradicts this tone and does not logically lead to the advice. Option C provides evidence that multitasking harms productivity, which directly supports the recommendation.

### seven_select-sp-kaoyan-12e4w1y
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, algorithms have increasingly taken over tasks once reserved for human judgment, from hiring to criminal sentencing. Proponents argue that data-driven decisions eli
- Blank 1: current `3:Yet this very reliance on data can introduce hidden biases that are hard to identify.` -> suggested `0:The algorithm’s decisions are often treated as objective truths, further entrenching systemic discrimination.`; confidence 0.85; Option D introduces a new idea about data reliance, but the contrast 'However' at blank 1 is best followed by a direct counterpoint to the optimism; Option A provides that contrast about objectivity and discrimination, while D fits better after the example in blank 2.
- Blank 2: current `0:The algorithm’s decisions are often treated as objective truths, further entrenching systemic discrimination.` -> suggested `3:Yet this very reliance on data can introduce hidden biases that are hard to identify.`; confidence 0.8; After the hiring example, Option D directly comments on the data reliance and hidden biases, which logically follows the example; Option A is about perception of decisions, which is less cohesive here.

### seven_select-sp-kaoyan-12os50s
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of individuals have embraced digital minimalism, a lifestyle that advocates reducing screen time and disconnecting from non-essential online platf
- Blank 4: current `3:This can create a subtle stigma against those who rely on digital tools for their livelihood or social connection.` -> suggested `6:The constant need to check one’s phone can be exhausting, but the alternative is not always liberating.`; confidence 0.9; Option D introduces stigma, which does not follow from 'psychological pressure of self-monitoring' or lead into 'effort to resist notifications causes stress'; Option G directly addresses the exhausting cycle and paradox, fitting the local context.
- Blank 5: current `0:Adherents often report feeling less anxious and more focused after cutting back on digital distractions.` -> suggested `3:This can create a subtle stigma against those who rely on digital tools for their livelihood or social connection.`; confidence 0.95; Option A discusses benefits of cutting back, contradicting the critical tone about moral judgment; Option D continues the stigma idea and leads naturally to 'This binary thinking ignores...'.

### seven_select-sp-kaoyan-12resji
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our hands, the boundary between work and personal life has grown increasingly porous. (1) This constant connectivity, whil
- Blank 2: current `1:The constant flow of notifications and the pressure to remain ‘always on’ have been linked to increased rates of anxiety and depression.` -> suggested `6:As a result, many employees find themselves trapped in a cycle of perpetual responsiveness, unable to truly disengage from work even during vacations.`; confidence 0.85; Option G directly follows the statistic about checking phones and leads into the definition of techno-stress, while B is a general claim that fits better later.
- Blank 3: current `0:Employees, in turn, feel compelled to respond to messages at all hours, blurring the line between being ‘at work’ and ‘off duty.’` -> suggested `1:The constant flow of notifications and the pressure to remain ‘always on’ have been linked to increased rates of anxiety and depression.`; confidence 0.8; Option B provides a logical consequence of the preceding sentence about organizations encouraging availability, while A is too similar to the previous idea and disrupts cause-effect flow.
- Blank 4: current `2:These policies, though promising, face resistance from traditional management cultures that equate visibility with productivity.` -> suggested `0:Employees, in turn, feel compelled to respond to messages at all hours, blurring the line between being ‘at work’ and ‘off duty.’`; confidence 0.9; Option A describes the problem that 'right to disconnect' policies aim to solve, while C refers to policies not yet introduced, causing a reference gap.

### seven_select-sp-kaoyan-13atfbm
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Urban green spaces, such as parks and community gardens, are often celebrated for their environmental and social benefits. (1) However, a growing body of research suggests that the
- Blank 1: current `0:These unintended consequences have prompted some scholars to call for a more equitable approach to urban greening.` -> suggested `6:Despite these benefits, the social costs of green spaces are often overlooked in urban planning.`; confidence 0.9; Option G provides a natural contrast to the preceding benefits, while A refers to consequences not yet introduced.
- Blank 4: current `6:Despite these benefits, the social costs of green spaces are often overlooked in urban planning.` -> suggested `0:These unintended consequences have prompted some scholars to call for a more equitable approach to urban greening.`; confidence 0.85; Option A logically follows the High Line example and leads into the conclusion; G fits better earlier.

### seven_select-sp-kaoyan-13xjbjd
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices dominate every aspect of daily life, a growing number of individuals are turning to digital minimalism as a conscious lifestyle choice. (1) This mov
- Blank 2: current `1:Some people find it impossible to disconnect completely from their online obligations.` -> suggested `2:Instead, they advocate for a complete abandonment of all digital devices.`; confidence 0.9; Option B does not logically follow the preceding sentence about setting boundaries; Option C directly contrasts with the moderate approach, fitting the critical perspective.
- Blank 3: current `3:Similarly, educational institutions have started to incorporate digital detox programs into their curricula.` -> suggested `1:Some people find it impossible to disconnect completely from their online obligations.`; confidence 0.85; Option D introduces an unrelated topic; Option B directly continues the critical perspective with a reason why disconnection is difficult, supported by the following example.

### seven_select-sp-kaoyan-14mq310
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices dominate our daily routines, a growing number of individuals are embracing digital minimalism—a lifestyle that intentionally reduces screen time. (1
- Blank 2: current `2:Social media algorithms are designed to exploit human psychological vulnerabilities.` -> suggested `3:Without the constant buzz of notifications, many find themselves grappling with a sense of emptiness.`; confidence 0.9; Option C shifts topic to algorithm design, while D directly follows the abrupt withdrawal causing stress.
- Blank 4: current `5:Striking a balance between online and offline life requires deliberate and ongoing effort.` -> suggested `6:These temporary setbacks, however, should not overshadow the long-term benefits of intentional living.`; confidence 0.95; G directly references 'temporary setbacks' from the preceding sentence, while F introduces a new idea too early.
- Blank 5: current `6:These temporary setbacks, however, should not overshadow the long-term benefits of intentional living.` -> suggested `5:Striking a balance between online and offline life requires deliberate and ongoing effort.`; confidence 0.9; G already used in blank 4; F leads naturally into the concluding sentence about mindful relationship.

### seven_select-sp-kaoyan-14u2sjz
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our own hands, the boundary between being connected and being overwhelmed has grown increasingly thin. (1) Yet this consta
- Blank 3: current `5:These findings challenge the long-held assumption that multitasking is an efficient way to handle modern workloads.` -> suggested `1:The constant stream of notifications and updates keeps our brains in a state of perpetual alert, preventing the restful downtime necessary for mental recovery.`; confidence 0.85; Option F refers to 'findings' before the Stanford study is introduced, causing a logical gap; Option B better continues the description of digital fatigue.

### seven_select-sp-kaoyan-15228fj
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In the competitive landscape of modern science, success is often measured by published papers and groundbreaking discoveries. (1) However, this narrow focus overlooks a crucial ele
- Blank 3: current `4:Moreover, the stigma attached to failure can lead researchers to hide or manipulate unfavorable data.` -> suggested `2:Such a cultural change requires not only institutional support but also a willingness to redefine what counts as progress.`; confidence 0.85; Option E introduces a new point about stigma, but the paragraph flow after 'discouraging young researchers' logically expects a sentence about cultural/institutional change before moving to funding agencies; option C fits this need.

### seven_select-sp-kaoyan-152kvhv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of our lives, a growing number of individuals are embracing digital minimalism as a conscious lifestyle choice. (1) At its cor
- Blank 3: current `3:By contrast, digital minimalists reject the notion that more connectivity automatically leads to better outcomes.` -> suggested `6:However, the movement has also faced accusations of being a privilege reserved for those with flexible schedules and stable incomes.`; confidence 0.85; Option D does not logically follow the preceding criticism; Option G introduces a new criticism that fits the flow before the balanced approach.

### seven_select-sp-kaoyan-15qwb1x
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age of information overload, an increasing number of professionals are embracing digital minimalism — a lifestyle that intentionally reduces screen time to reclaim focus and 
- Blank 2: current `3:Social media platforms are specifically designed to exploit human psychological vulnerabilities.` -> suggested `2:However, critics argue that digital minimalism is a privilege not accessible to everyone.`; confidence 0.85; Option D introduces an unrelated topic about social media design, breaking the logical flow from the paradox to the example. Option C provides a contrasting viewpoint that fits the context.

### seven_select-sp-kaoyan-15wumdp
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, deliberately reducing their screen time and social media usage. (1) However, a closer examination reve
- Blank 1: current `0:Advocates claim that this practice leads to improved mental health and greater productivity.` -> suggested `2:Yet the very act of disconnecting can trigger a sense of missing out on important social updates.`; confidence 0.85; Option A is a positive claim, but the following 'However' requires a preceding statement that is contradicted; Option C directly introduces the negative consequence that 'However' elaborates on, making the flow logical.
- Blank 4: current `4:This phenomenon is particularly pronounced among young adults who rely heavily on social media for social validation.` -> suggested `5:Therefore, a one-size-fits-all approach to digital reduction is unlikely to be effective.`; confidence 0.9; Option E refers to a specific phenomenon from earlier, but blank 4 follows 'This finding' and precedes a conclusion about balance; Option F provides a logical conclusion that leads naturally to the final sentence.

### seven_select-sp-kaoyan-16jmsus
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, an increasing number of companies have turned to artificial intelligence to streamline their hiring processes. Algorithms can scan thousands of résumés in seconds,
- Blank 2: current `0:Applicants often feel frustrated when they receive no explanation for automated rejections.` -> suggested `1:Consequently, the very tool designed to eliminate human bias may actually amplify it.`; confidence 0.9; The current option A is too general and breaks the logical flow after the specific example of bias; option B directly ties the example to the consequence of amplifying bias.

### seven_select-sp-kaoyan-194s4a8
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices constantly demand our attention, a growing number of individuals are turning to digital minimalism — a philosophy that advocates intentional use of 
- Blank 2: current `2:Interestingly, those who succeed often report an initial period of discomfort followed by a profound sense of freedom.` -> suggested `1:Studies show that constant connectivity reshapes neural pathways, making withdrawal symptoms a real phenomenon.`; confidence 0.9; Option B explains the neural basis of withdrawal, directly supporting the paradox that the cure mimics the disease, while Option C about success and freedom does not fit the context.
- Blank 3: current `1:Studies show that constant connectivity reshapes neural pathways, making withdrawal symptoms a real phenomenon.` -> suggested `2:Interestingly, those who succeed often report an initial period of discomfort followed by a profound sense of freedom.`; confidence 0.85; Option C about initial discomfort and freedom logically leads to the relapse described in the next sentence, whereas Option B is better placed earlier to explain the paradox.
- Blank 4: current `5:Instead, they should focus on replacing passive consumption with purposeful activities like reading or face-to-face conversations.` -> suggested `3:Many people mistake digital minimalism for a complete rejection of technology, which is a common misconception.`; confidence 0.8; Option D introduces the misconception that minimalism is total rejection, which the next sentence corrects; Option F is a directive that fits better after the clarification.

### seven_select-sp-kaoyan-196lope
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where smartphones and social media dominate daily life, the concept of being constantly connected has become an unspoken expectation. (1) This phenomenon, often celebrate
- Blank 4: current `5:This shift can lead to a decline in the depth of emotional bonds between people.` -> suggested `4:E. Instead, they often leave individuals feeling drained and disconnected.`; confidence 0.85; Option F's 'this shift' is vague; Option E's 'they' refers clearly to tools and fits the negative tone before countermeasures.
- Blank 5: current `4:Instead, they often leave individuals feeling drained and disconnected.` -> suggested `5:F. This shift can lead to a decline in the depth of emotional bonds between people.`; confidence 0.8; Option E is too specific for a concluding sentence; Option F provides a broader summary leading naturally to the recommendation.

### seven_select-sp-kaoyan-1adec3z
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The academic publishing industry has undergone profound transformations over the past two decades, driven largely by digital technology and shifting attitudes toward knowledge shar
- Blank 2: current `5:Proponents of open access emphasize that it democratizes knowledge and reduces inequality in research access.` -> suggested `6:Many funding agencies now require grant recipients to publish their findings in open-access venues.`; confidence 0.85; Option F is too general and does not logically lead to the following criticism about fees and peer review; Option G provides a direct cause for the rise of open-access journals, making the transition to criticism smoother.
- Blank 5: current `3:This shift has empowered early-career researchers to gain visibility without relying solely on prestigious journals.` -> suggested `2:Some established publishers have responded by launching their own open-access initiatives.`; confidence 0.75; Option D about early-career researchers is a possible but weak link; Option C about publishers' response follows logically from universities revising criteria and leads naturally to the concluding hybrid model.

### seven_select-sp-kaoyan-1ccok0g
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become indispensable, the line between productivity and constant distraction grows increasingly blurred. (1) However, this state of perpetual a
- Blank 1: current `1:Many people believe that staying connected at all times boosts their productivity and social presence.` -> suggested `5:Yet the same technology that connects us also fragments our attention across multiple streams.`; confidence 0.9; Option B introduces an unsupported belief, while F provides a contrastive transition that logically follows the opening and leads into the toll on cognition.
- Blank 5: current `2:Without deliberate intervention, the very tools designed to save time end up consuming it.` -> suggested `4:These findings highlight the urgent need for individuals to reassess their relationship with technology.`; confidence 0.85; Option E directly references the preceding study and leads naturally into the recommendation, while C is a general statement disconnected from the evidence.

### seven_select-sp-kaoyan-1empwbv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, intentionally reducing their screen time to reclaim focus and mental well-being. (1) However, a closer
- Blank 3: current `3:Digital detox retreats have become a booming industry, promising participants a path to inner peace.` -> suggested `2:Some studies even suggest that moderate, intentional use of digital tools can enhance rather than harm well-being.`; confidence 0.85; The current option about digital detox retreats is a non sequitur after the discussion of cognitive load; the suggested option provides a logical contrast that fits the 'Moreover' discourse.

### seven_select-sp-kaoyan-1ev4vpv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and online distractions. (1) However, this seemingly l
- Blank 1: current `0:Many proponents argue that stepping away from devices fosters deeper concentration and real-world relationships.` -> suggested `5:Yet the cognitive benefits of digital engagement are often downplayed by minimalist advocates.`; confidence 0.9; The passage sets up a contrast to the initial praise of digital minimalism; F directly introduces the overlooked cognitive benefits, while A merely restates proponents' views without advancing the argument.

### seven_select-sp-kaoyan-1eyngtv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones have become extensions of our hands, the concept of a ‘digital detox’ has gained considerable traction. Many individuals, overwhelmed by the constant ba
- Blank 3: current `1:The pressure to maintain a curated online persona can be psychologically draining.` -> suggested `2:Critics argue that the benefits of digital detox are often exaggerated by wellness industries.`; confidence 0.9; Option B about curated persona is a tangent; Option C directly follows the study's counterintuitive result and leads into the next sentence about digital world as a conduit.
- Blank 5: current `4:Many tech companies are now designing features to help users manage screen time.` -> suggested `5:A more sustainable approach, researchers suggest, involves setting boundaries rather than total abstinence.`; confidence 0.95; Option E about tech companies is off-topic; Option F introduces the boundary vs. abstinence idea that the concluding sentence elaborates on.

### seven_select-sp-kaoyan-1fy4i53
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones and social media dominate daily life, the concept of ‘digital detox’ has gained considerable traction. (1) However, a growing body of research suggests 
- Blank 3: current `5:Nevertheless, the allure of instant gratification remains a powerful counterforce.` -> suggested `6:Some even argue that digital platforms are deliberately engineered to be addictive.`; confidence 0.85; Option F is a general statement about instant gratification, but the context requires a specific claim about digital platforms being engineered to be addictive to lead into the critics' argument that the measures are cosmetic.

### seven_select-sp-kaoyan-1g7t7pb
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of ourselves, the benefits of constant connectivity are often celebrated. (1) This phenomenon, often termed 'digital fatigue,
- Blank 3: current `1:Many people find it difficult to disconnect even during vacations.` -> suggested `6:The pressure to be available around the clock blurs the boundaries between work and personal life.`; confidence 0.85; Option G directly continues the theme of constant availability and blurred boundaries from the preceding sentence, while B introduces a new topic about vacations that disrupts coherence.

### seven_select-sp-kaoyan-1h3auk1
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of daily life, a growing number of individuals are embracing digital minimalism—a philosophy that advocates intentional use of
- Blank 2: current `2:The practice has gained traction particularly among young professionals in urban centers who feel overwhelmed by information overload.` -> suggested `1:One notable experiment involved a group of office workers who agreed to keep their smartphones in a locked drawer during work hours.`; confidence 0.9; The phrase 'For instance' requires a specific example or experiment, not a general statement about who adopts the practice.
- Blank 4: current `6:Digital minimalism, however, is not a one-size-fits-all solution, and its implementation varies widely across different socioeconomic groups.` -> suggested `3:Low-wage gig workers, by contrast, often depend on constant app notifications to secure their next income stream.`; confidence 0.8; The preceding sentence discusses empirical studies and small adjustments; the current option introduces a new topic, while the suggested continues the contrast from the previous paragraph more naturally.

### seven_select-sp-kaoyan-1i2xgop
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often mistaken for productivity, a growing number of professionals are turning to digital minimalism as a conscious strategy to reclaim focus. (1) T
- Blank 2: current `5:This practice, known as ‘time-boxing,’ allows the brain to enter deeper states of flow without interruption.` -> suggested `2:Many find that scheduling offline hours in the evening helps recalibrate their sleep patterns.`; confidence 0.85; The example of a software engineer disabling notifications and reserving email checks is an instance of time-boxing, so the sentence defining time-boxing fits better after that example, not before it. The current placement disrupts the flow from the general philosophy to the specific example.
- Blank 3: current `6:After the initial discomfort, however, most users report a surprising sense of liberation and mental clarity.` -> suggested `0:Digital minimalism, however, is not a one-size-fits-all solution and requires personal experimentation.`; confidence 0.8; Blank 3 follows the mention of 'phantom vibration syndrome' and initial withdrawal anxiety. The sentence about liberation and mental clarity logically comes after the adaptation period (blank 4), not before. The sentence about personal experimentation fits better here as a transition from the difficulty to the need for tailored approaches.
- Blank 4: current `1:The constant pings and alerts have been shown to fragment concentration and reduce cognitive performance.` -> suggested `6:After the initial discomfort, however, most users report a surprising sense of liberation and mental clarity.`; confidence 0.9; Blank 4 introduces study results after a two-week adaptation period. The sentence about liberation and mental clarity directly contrasts the initial discomfort and fits as the outcome of the adaptation, whereas the sentence about pings and alerts is a general statement that belongs earlier in the passage.

### seven_select-sp-kaoyan-1i3zhv7
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where smartphones have become extensions of our hands, the line between being connected and being overwhelmed has grown increasingly thin. (1) Yet, beneath the surface of
- Blank 4: current `4:Instead, they recommend setting specific boundaries, such as no-phone zones during meals or before bedtime.` -> suggested `2:C. However, completely unplugging from the digital world is neither practical nor desirable for most people.`; confidence 0.85; Blank 4 follows a sentence advocating digital detoxes; a counterpoint is needed before specific recommendations. Option C provides that contrast, while E's 'they' lacks a clear antecedent and jumps ahead.
- Blank 5: current `2:However, completely unplugging from the digital world is neither practical nor desirable for most people.` -> suggested `4:E. Instead, they recommend setting specific boundaries, such as no-phone zones during meals or before bedtime.`; confidence 0.85; After the counterpoint in blank 4 (now C), the paragraph needs a logical follow-up: experts recommend specific boundaries. Option E provides that, while C placed here would be redundant and disrupt the flow.

### seven_select-sp-kaoyan-1j7801f
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In contemporary consumer culture, individuals are often confronted with an overwhelming array of options, from basic necessities to luxury goods. (1) This abundance, rather than fo
- Blank 1: current `0:However, the problem is not merely about having too many products on the shelf.` -> suggested `4:Yet, the modern economy relentlessly promotes endless choice as a sign of freedom and prosperity.`; confidence 0.85; Option A is too vague and interrupts the logical flow; E provides a necessary contrast to the opening.

### seven_select-sp-kaoyan-1jfpbt5
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices constantly vie for our attention, the ability to juggle multiple tasks simultaneously is often celebrated as a hallmark of efficiency. (1) However, 
- Blank 3: current `4:Consequently, the quality of output often suffers, even if the worker feels busy and productive.` -> suggested `3:These findings challenge the glorification of multitasking in modern workplace culture.`; confidence 0.85; Blank 3 follows a general description of cognitive cost and leads into a specific workplace example; D bridges research to workplace context, while E is too specific and fits better after the example.
- Blank 4: current `3:These findings challenge the glorification of multitasking in modern workplace culture.` -> suggested `4:Consequently, the quality of output often suffers, even if the worker feels busy and productive.`; confidence 0.85; Blank 4 follows a specific study example; E logically concludes the example, while D is a broader statement that fits better before the example.

### seven_select-sp-kaoyan-1jwhwli
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era defined by unprecedented access to information, the modern consumer faces a curious dilemma. While the abundance of options was once hailed as a hallmark of freedom, rece
- Blank 3: current `3:Social media platforms further amplify this effect by constantly showcasing the curated lives of others.` -> suggested `2:These mechanisms often cause shoppers to delay purchases or abandon their carts altogether.`; confidence 0.9; The preceding sentence introduces two psychological mechanisms; option C directly refers to 'these mechanisms' and describes their behavioral consequences, maintaining logical flow. Option D introduces a new topic (social media) without a clear link.
- Blank 4: current `4:Therefore, understanding one's own decision-making style is crucial for navigating the modern marketplace.` -> suggested `3:Social media platforms further amplify this effect by constantly showcasing the curated lives of others.`; confidence 0.85; The passage discusses maximizers vs. satisficers, then moves to digital platforms' solutions. Option D extends the external amplification before solutions, while option E's conclusion is premature and disrupts the sequence.

### seven_select-sp-kaoyan-1m1e5hi
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The fashion industry has undergone a radical transformation over the past two decades, with fast fashion brands churning out new collections at an unprecedented pace. (1) This mode
- Blank 2: current `0:Garment factories in developing nations frequently exploit workers who have no alternative employment.` -> suggested `4:The convenience of online shopping has further accelerated the cycle of consumption.`; confidence 0.85; The paragraph focuses on environmental harm; the current option shifts to social exploitation, breaking coherence. Option E maintains the environmental-consumer behavior flow.
- Blank 3: current `2:Yet these efforts are insufficient to offset the damage caused by overproduction.` -> suggested `0:Garment factories in developing nations frequently exploit workers who have no alternative employment.`; confidence 0.9; The preceding sentence introduces 'social cost', so the blank should address social exploitation, not recycling efforts. Option A directly fits.
- Blank 4: current `5:Without such measures, the negative impacts on both people and the planet will only intensify.` -> suggested `2:Yet these efforts are insufficient to offset the damage caused by overproduction.`; confidence 0.9; The blank follows mention of recycling programs as greenwashing; option C logically comments on those efforts. Option F is a general warning that fits better later.
- Blank 5: current `4:The convenience of online shopping has further accelerated the cycle of consumption.` -> suggested `5:Without such measures, the negative impacts on both people and the planet will only intensify.`; confidence 0.85; The blank is the final sentence before the concluding paragraph; option F provides a logical warning leading into consumer choice. Option E is a tangential point that disrupts the conclusion.

### seven_select-sp-kaoyan-1n3izbj
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and online distractions. (1) This trend is often prais
- Blank 3: current `3:Instead, they often replace online interactions with equally curated offline activities, such as book clubs or hiking groups.` -> suggested `2:C. Critics, however, contend that digital minimalism is merely a privilege of the wealthy who can afford to disconnect.`; confidence 0.85; Option D has no clear antecedent for 'they', while C directly introduces the elitism critique that the following sentence elaborates on.
- Blank 5: current `5:Some researchers have even linked moderate social media use to improved emotional regulation and empathy.` -> suggested `6:G. Nevertheless, the movement continues to gain traction among young professionals seeking respite from information overload.`; confidence 0.9; F introduces an unrelated point about social media benefits, while G offers a contrast that leads into the concluding balanced approach.

### seven_select-sp-kaoyan-1nip3rd
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and curbing reliance on social media. Proponents argue
- Blank 1: current `1:Critics also point out that the advice to 'unplug' is often given by those who can afford to hire assistants to manage their digital chores.` -> suggested `0:Yet this seemingly benign movement has sparked heated debate among sociologists.`; confidence 0.9; Option B's 'also' implies prior criticism, but the preceding text is positive; option A provides a natural contrast and introduces the critical turn.
- Blank 4: current `0:Yet this seemingly benign movement has sparked heated debate among sociologists.` -> suggested `2:The irony is that the very tools we seek to escape are the ones that keep many people afloat.`; confidence 0.85; Option A is a general statement better placed earlier; option C directly echoes the preceding point about marginalized groups relying on digital tools for survival.

### seven_select-sp-kaoyan-1ond3r3
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and curbing reliance on social media. (1) Yet beneath 
- Blank 1: current `0:Many advocates claim that unplugging leads to greater focus and well-being.` -> suggested `1:However, the irony is that digital minimalism can inadvertently increase cognitive load.`; confidence 0.9; Option A is a general positive claim, but the passage's 'Yet beneath... a paradox' requires a contrasting ironic statement; B directly introduces the irony.
- Blank 2: current `2:This constant vigilance defeats the very purpose of reducing mental clutter.` -> suggested `5:Without realizing it, they trade one screen for another, albeit with a different purpose.`; confidence 0.85; The preceding sentence describes 'constant monitoring' as mental labor; F continues with 'trade one screen for another' as an example of that labor, while C's 'This constant vigilance' is premature.
- Blank 3: current `3:These activities, ironically, consume the same time and attention they sought to save.` -> suggested `6:The same applies to those who switch from Instagram to note-taking apps.`; confidence 0.8; The blank follows a specific example (deleting apps, researching tools); G extends the example to another case, while D is a general statement that fits better after examples are fully developed.
- Blank 4: current `5:Without realizing it, they trade one screen for another, albeit with a different purpose.` -> suggested `3:These activities, ironically, consume the same time and attention they sought to save.`; confidence 0.8; Blank 4 follows the examples (deleting apps, researching tools, switching apps); D provides a summarizing ironic conclusion, while F is more specific and less cohesive as a concluding remark.
- Blank 5: current `1:However, the irony is that digital minimalism can inadvertently increase cognitive load.` -> suggested `2:This constant vigilance defeats the very purpose of reducing mental clutter.`; confidence 0.85; Blank 5 is the final sentence before the conclusion; C ties back to 'constant monitoring' and 'mental labor' for a strong concluding point, while B is a general statement better placed earlier.

### seven_select-sp-kaoyan-1ow4y5x
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices have become ubiquitous, the line between being connected and being overwhelmed has grown increasingly thin. (1) This constant connectivity, while be
- Blank 1: current `2:Digital devices have revolutionized how we work, learn, and socialize.` -> suggested `4:The constant barrage of notifications and messages leaves little room for uninterrupted thought.`; confidence 0.9; The passage opens with the problem of digital overload; option E directly continues the idea of being overwhelmed, while C introduces a positive revolution that disrupts the negative tone.
- Blank 2: current `4:The constant barrage of notifications and messages leaves little room for uninterrupted thought.` -> suggested `0:Many people mistakenly believe that more connectivity automatically leads to greater productivity.`; confidence 0.85; After mentioning fragmented attention and deep focus, the next sentence should elaborate on the misconception about productivity, not repeat the barrage idea which fits better in blank 1.
- Blank 4: current `0:Many people mistakenly believe that more connectivity automatically leads to greater productivity.` -> suggested `5:Some experts argue that the problem lies not in the devices themselves but in our inability to manage them.`; confidence 0.8; After the digital detox example, the passage shifts to solution-oriented discussion; option F (experts on management) bridges to mindful usage better than a mistaken belief that was already implied earlier.

### seven_select-sp-kaoyan-1p2ducp
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of professionals have embraced digital minimalism, deliberately reducing their screen time to enhance productivity and mental well-being. (1) Yet 
- Blank 4: current `3:Consequently, many digital minimalists eventually reverted to their old habits within six months.` -> suggested `6:G. Similarly, a manager who turned off notifications during deep work hours was praised for his efficiency.`; confidence 0.9; Blank 4 follows a specific example of a junior analyst; the passage needs a parallel example to illustrate the stigma, not a conclusion about reverting habits. Option G provides a contrasting example that fits the flow before the concluding sentence.
- Blank 5: current `1:Instead, they are advised to schedule regular digital detox periods during weekends.` -> suggested `3:D. Consequently, many digital minimalists eventually reverted to their old habits within six months.`; confidence 0.85; Blank 5 is the final sentence before the concluding advice; the passage needs a logical consequence of the stigma and exclusion described, leading to the key point about transparent boundaries. Option D provides that consequence, while B introduces a new recommendation that disrupts the flow.

### seven_select-sp-kaoyan-1q5l2ko
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices pervade every aspect of daily life, a growing number of individuals are embracing the philosophy of digital minimalism. This movement advocates for 
- Blank 2: current `1:Those who lack reliable internet access are often the ones most in need of the opportunities it provides.` -> suggested `3:Consequently, the movement has been criticized for being elitist and out of touch with everyday realities.`; confidence 0.9; The sentence about tension logically leads to criticism; Option D directly follows, while Option B introduces a new topic prematurely.
- Blank 4: current `3:Consequently, the movement has been criticized for being elitist and out of touch with everyday realities.` -> suggested `1:Those who lack reliable internet access are often the ones most in need of the opportunities it provides.`; confidence 0.85; Blank 4 follows structural inequality; Option B provides a concrete example, while Option D is a general criticism already used.

### seven_select-sp-kaoyan-1q9y69p
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The pandemic has fundamentally reshaped the way we work, with remote employment becoming a permanent fixture for many industries. (1) However, beneath the surface of flexibility an
- Blank 1: current `0:Yet the benefits of remote work are undeniable for many employees.` -> suggested `6:These findings challenge the assumption that remote work is uniformly beneficial.`; confidence 0.9; Option A introduces benefits, contradicting the 'hidden costs' focus signaled by 'However' in the next sentence. Option G directly challenges the assumption of uniform benefit, fitting the contrast.
- Blank 2: current `6:These findings challenge the assumption that remote work is uniformly beneficial.` -> suggested `5:The erosion of work-life boundaries has been linked to a 30% increase in burnout symptoms among remote employees.`; confidence 0.85; Blank 2 follows a sentence about isolation and declining productivity; Option F logically extends to burnout from blurred boundaries, while Option G is too general for this position.

### seven_select-sp-kaoyan-1skqfd
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, the concept of digital minimalism has gained considerable traction among professionals seeking to reclaim their time and focus. (1) However, this seemingly straigh
- Blank 3: current `3:The initial enthusiasm for digital detox often fades when users realize the practical challenges involved.` -> suggested `2:App-blocking software requires constant updates and monitoring, subtly reinforcing the habit of checking one’s phone.`; confidence 0.9; The passage's flow from paradox (blank 2) to a concrete example (app-blocking software) is logical; the current option D is a general statement that breaks this specific-to-general progression.

### seven_select-sp-kaoyan-1t4eno6
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Scientific progress is often portrayed as a linear process of hypothesis, experimentation, and conclusion. Yet history reveals that many groundbreaking discoveries owe their existe
- Blank 3: current `1:His observation of the mold’s effect was not a random event but a result of his trained eye.` -> suggested `2:C. Rather, it requires a mindset that can pivot from a planned path to an unanticipated one.`; confidence 0.9; The current key (B) refers to Fleming's mold, which is out of place after 'serendipity is not merely luck'; option C directly continues the contrast and fits the theme of mindset.
- Blank 5: current `2:Rather, it requires a mindset that can pivot from a planned path to an unanticipated one.` -> suggested `1:B. His observation of the mold’s effect was not a random event but a result of his trained eye.`; confidence 0.85; Blank 5 concludes the paragraph about embracing serendipity with rigor; option B provides a concrete example of trained observation supporting rigor, while C is a general statement that fits better in blank 3.

### seven_select-sp-kaoyan-1tinvle
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our hands, the benefits of constant connectivity are widely celebrated. (1) This phenomenon, often referred to as 'techno-
- Blank 3: current `1:Critics, however, argue that these measures are merely band-aid solutions, as the core algorithm design remains geared toward maximizing user engagement.` -> suggested `5:Such tools, while helpful, often fail to address the root cause: the addictive design of the platforms themselves.`; confidence 0.9; B introduces 'critics' and 'these measures' without prior mention of measures, making it incoherent. F is a better fit as it refers to the tools mentioned later, but the best fit is C; however, F is more coherent than B.

### seven_select-sp-kaoyan-1tmkyr8
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The digital age has brought unprecedented convenience to our daily lives. From online shopping to instant communication, technology has streamlined countless tasks that once requir
- Blank 2: current `2:This makes it one of the fastest-growing contributors to environmental degradation.` -> suggested `1:Surprisingly, the energy consumption of data centers has doubled over the past decade.`; confidence 0.9; Option C lacks a clear antecedent for 'it' and is too vague; Option B provides a specific statistic that logically supports the next sentence about emissions.
- Blank 3: current `1:Surprisingly, the energy consumption of data centers has doubled over the past decade.` -> suggested `2:This makes it one of the fastest-growing contributors to environmental degradation.`; confidence 0.85; Option B is a specific statistic that fits better before the example; Option C serves as a general conclusion that should follow the example, not precede it.

### seven_select-sp-kaoyan-1tyk35v
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: For decades, mainstream economics has relied on the assumption that individuals make decisions based on complete information and rational calculation. This model, known as Homo eco
- Blank 3: current `1:Such irrational behaviors challenge the very foundation of traditional economic models.` -> suggested `4:Even experts, such as professional traders and judges, are not immune to these cognitive pitfalls.`; confidence 0.85; Blank 3 follows the anchoring experiment; Option E naturally extends the example by noting expert susceptibility, while Option B is too general and interrupts the sequence of specific biases.

### seven_select-sp-kaoyan-1uwnuqb
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices permeate every aspect of daily life, a growing number of individuals are embracing digital minimalism as a conscious lifestyle choice. (1) This phil
- Blank 3: current `0:Digital minimalists often report improved sleep quality and deeper interpersonal relationships after cutting back on nonessential digital interactions.` -> suggested `4:For example, a software engineer who deletes all entertainment apps may find it harder to unwind after work, leading to increased stress.`; confidence 0.9; Option A gives a positive outcome, but blank 3 follows critics' concerns about social isolation and information access, so a negative example like E maintains coherence.

### seven_select-sp-kaoyan-1v2bbjc
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a countermeasure to the overwhelming presence of technology in daily life. (1) However, a less discussed aspect is the ps
- Blank 5: current `5:Technology companies have designed platforms to be addictive, making self-regulation difficult.` -> suggested `3:Some people find it easier to quit social media cold turkey than to moderate their usage gradually.`; confidence 0.9; The passage concludes with 'intentional engagement rather than complete abstinence', so the preceding sentence should contrast gradual moderation with cold turkey. Option D fits this contrast, while F introduces an unrelated point about addiction.

### seven_select-sp-kaoyan-1w5tjb6
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices constantly vie for our attention, a growing number of individuals are embracing the philosophy of digital minimalism. (1) This approach, however, do
- Blank 1: current `1:Many people find it hard to resist the lure of instant gratification from likes and comments.` -> suggested `2:Instead, it encourages mindful and purposeful use of digital tools.`; confidence 0.9; The passage negates complete abandonment, so the next sentence should state what it does advocate; C directly contrasts with the negation, while B is off-topic.
- Blank 5: current `5:The key is to replace passive consumption with active engagement.` -> suggested `3:Proponents of digital minimalism often report higher levels of life satisfaction.`; confidence 0.85; The preceding sentence discusses reclaiming time for deep work and relationships; D naturally supports that claim, while F is a general principle that fits better earlier.

### seven_select-sp-kaoyan-1xkn6g2
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The peer review system has long been considered the cornerstone of scientific publishing, ensuring that only rigorous research reaches the public domain. (1) However, in recent yea
- Blank 3: current `3:This has led to a growing number of calls for alternative models.` -> suggested `2:C. These alternatives, however, still lack the credibility that comes with formal peer review.`; confidence 0.85; The preceding sentences discuss open peer review and preprint servers as experiments; 'These alternatives' directly refers to them, while D's 'This' lacks a clear antecedent and is too generic.
- Blank 5: current `5:Some have proposed a tiered system where preliminary findings are posted quickly, with in-depth review reserved for later versions.` -> suggested `6:G. Despite these efforts, the number of retracted papers continues to rise, suggesting that the current safeguards are insufficient.`; confidence 0.8; Blank 5 is the final sentence before the concluding paragraph; F introduces a new proposal too late, while G's 'Despite these efforts' logically follows the survey data and leads into the final decision about reform.

### seven_select-sp-kaoyan-1xuzuyd
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our hands, the boundary between work and personal life has grown increasingly blurred. (1) This constant connectivity, whi
- Blank 2: current `4:This trend is particularly pronounced in high-tech industries, where remote work has become the norm.` -> suggested `3:Without deliberate effort, the very tools designed to liberate us can become sources of chronic stress.`; confidence 0.85; Option D directly comments on the unintended consequence of digital tools mentioned in the preceding sentence, while E shifts to high-tech industries without contextual support.

### seven_select-sp-kaoyan-1yobexo
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices permeate every aspect of daily life, a growing number of individuals are embracing digital minimalism as a conscious countermeasure. (1) This philos
- Blank 1: current `1:Instead, they advocate for a balanced approach that prioritizes meaningful online activities.` -> suggested `0:Digital minimalism, however, is not a one-size-fits-all solution and requires personal adaptation.`; confidence 0.85; Option B lacks a clear antecedent for 'they', while Option A logically qualifies the philosophy introduced in the previous sentence.

### seven_select-sp-kaoyan-28w8l3
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Urban greening initiatives, such as planting trees and creating parks, have been widely promoted as a solution to environmental and social problems in cities. (1) However, a growin
- Blank 3: current `1:These costs are frequently underestimated in the initial project proposals.` -> suggested `0:A. Not all residents welcome these changes, as they often feel alienated from the decision-making process.`; confidence 0.85; Blank 3 follows the description of green gentrification and displacement; option A about residents feeling alienated fits the social consequence theme, while B about costs is premature before the cost discussion in the next sentence.
- Blank 4: current `0:Not all residents welcome these changes, as they often feel alienated from the decision-making process.` -> suggested `1:B. These costs are frequently underestimated in the initial project proposals.`; confidence 0.8; Blank 4 follows a sentence about maintenance costs diverting funds; B directly continues the cost theme, while A about alienation is less coherent here.

### seven_select-sp-kaoyan-392i5x
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our own hands, the boundary between being connected and being overwhelmed has grown increasingly blurred. (1) This constan
- Blank 4: current `4:Therefore, universities have begun implementing policies that restrict smartphone use in classrooms.` -> suggested `2:C. Instead, we should embrace periodic digital detoxes and set clear boundaries for screen time.`; confidence 0.9; The preceding sentence introduces the idea of cultivating a mindful relationship with technology, and option C directly continues that thought with 'Instead, we should...', while option E shifts abruptly to university policies without any prior mention of such policies.

### seven_select-sp-kaoyan-4l0c5c
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices dominate our attention, a growing number of individuals are embracing digital minimalism — the intentional reduction of screen time to reclaim focus
- Blank 2: current `2:However, the benefits of reduced screen time are often overstated by proponents of the movement.` -> suggested `4:The findings underscore the need for further research into the long-term effects of digital detox.`; confidence 0.85; Option C introduces a new topic about overstated benefits, breaking the logical flow from the study's finding on social anxiety to the predictor of anxiety.
- Blank 5: current `3:Instead, a balanced approach that allows for occasional digital connection may be more sustainable.` -> suggested `6:Such findings have prompted some experts to call for a more nuanced understanding of digital well-being.`; confidence 0.8; Option D repeats the balanced approach already implied, while G provides a natural concluding remark that leads into the final sentence about personalized approach.

### seven_select-sp-kaoyan-5sgf31
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The shift to remote work, accelerated by the pandemic, has reshaped the modern workplace in profound ways. (1) Yet a growing body of evidence suggests that this arrangement carries
- Blank 2: current `3:These savings, however, must be weighed against the potential decline in innovation and employee well-being.` -> suggested `0:A. Many companies have reported significant cost savings from reduced office space and utilities.`; confidence 0.9; No antecedent for 'These savings' at blank 2; option A introduces cost savings, which should precede D.
- Blank 3: current `0:Many companies have reported significant cost savings from reduced office space and utilities.` -> suggested `3:D. These savings, however, must be weighed against the potential decline in innovation and employee well-being.`; confidence 0.85; Option A about cost savings is irrelevant after discussing burnout; D logically follows cost savings introduced earlier.

### seven_select-sp-kaoyan-65zqiw
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and online engagement to reclaim mental focus. (1) How
- Blank 1: current `0:Advocates argue that constant connectivity erodes attention spans and deep relationships.` -> suggested `1:Yet this very disconnection can inadvertently amplify feelings of loneliness and social exclusion.`; confidence 0.9; Option A merely restates advocates' views, not providing the contrast needed after 'However'. Option B directly introduces the overlooked social cost.
- Blank 3: current `1:Yet this very disconnection can inadvertently amplify feelings of loneliness and social exclusion.` -> suggested `2:Many people find it difficult to maintain offline friendships without digital reminders.`; confidence 0.85; Option B is too general and repeats the idea of loneliness; Option C provides a concrete supporting detail for the example.

### seven_select-sp-kaoyan-770u5n
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a lifestyle choice aimed at reducing screen time and reclaiming focus. Advocates argue that by limiting digital distracti
- Blank 4: current `2:Instead, we might adopt selective disconnection — turning off notifications for non-essential apps while staying reachable for important communications.` -> suggested `5:F. Digital minimalism, when applied rigidly, can paradoxically increase the very stress it seeks to reduce.`; confidence 0.85; Blank 4 follows a study showing negative outcomes of strict digital minimalism; option F directly comments on that rigidity increasing stress, while option C introduces a solution prematurely before the paragraph's concluding turn.
- Blank 5: current `5:Digital minimalism, when applied rigidly, can paradoxically increase the very stress it seeks to reduce.` -> suggested `2:C. Instead, we might adopt selective disconnection — turning off notifications for non-essential apps while staying reachable for important communications.`; confidence 0.9; Blank 5 follows 'Yet this does not mean we should abandon... The key lies in striking a balance...' and leads to the concluding sentence; option C offers a concrete balanced approach, fitting the logical flow, while option F is a critique that belongs earlier.

### seven_select-sp-kaoyan-7fams5
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of daily life, a growing number of individuals are embracing the philosophy of digital minimalism. (1) This deliberate reducti
- Blank 2: current `1:Some studies even suggest that excessive screen time can rewire the brain, making sustained attention increasingly difficult.` -> suggested `5:They argue that the benefits of digital minimalism are often overstated and not supported by rigorous research.`; confidence 0.85; Option B introduces a new topic about brain rewiring, breaking the logical flow from the general claim to the specific example. Option F maintains the critical perspective and leads naturally into the example.

### seven_select-sp-kaoyan-82970z
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Urban greening initiatives, such as planting trees and creating parks, have been widely promoted as solutions to environmental and social problems. (1) However, a growing body of r
- Blank 3: current `4:This process can erase the cultural identity of long-standing communities.` -> suggested `1:Many residents celebrate the arrival of new parks as a sign of urban renewal.`; confidence 0.85; The current sentence about cultural identity is a non sequitur after discussing non-native plants and ecological disruption; the suggested sentence provides a contrasting positive view that fits the 'consequently' logic.
- Blank 4: current `5:Such participatory approaches help ensure that greening projects serve the needs of all residents, not just the wealthy.` -> suggested `4:This process can erase the cultural identity of long-standing communities.`; confidence 0.9; The current sentence introduces a solution too early; the suggested sentence continues the negative consequences before the solution paragraph.
- Blank 5: current `6:The initial costs of planting trees are often offset by reduced energy bills for cooling.` -> suggested `5:Such participatory approaches help ensure that greening projects serve the needs of all residents, not just the wealthy.`; confidence 0.95; The current sentence about cost-benefit is irrelevant to the solution paragraph; the suggested sentence directly supports the call for participatory planning.

### seven_select-sp-kaoyan-82a5pt
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of daily life, a growing number of individuals are embracing a counterintuitive lifestyle known as digital minimalism. (1) Thi
- Blank 2: current `3:This sense of liberation, they argue, fosters deeper relationships and greater creativity in other areas of life.` -> suggested `2:Social media platforms, in particular, are often cited as primary culprits in eroding attention spans.`; confidence 0.9; Option D has no antecedent for 'this sense of liberation', while C provides a specific example that logically leads into the following 'For instance' sentence about scaling back social media.
- Blank 4: current `4:Studies show that the average person checks their smartphone over 150 times per day, often without any conscious decision.` -> suggested `0:Digital minimalism, however, is not a one-size-fits-all solution, and its implementation varies widely among individuals.`; confidence 0.85; Option E provides a supporting statistic about smartphone checking that directly illustrates the engineered attention-capture mentioned in the preceding sentence, while A is a general statement that fits better elsewhere.

### seven_select-sp-kaoyan-96zp5z
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In today’s hyperconnected world, the ability to juggle multiple tasks simultaneously is often celebrated as a hallmark of efficiency. (1) However, a growing body of cognitive resea
- Blank 4: current `5:Interestingly, some people perform better under pressure and actually thrive on multitasking.` -> suggested `1:Yet this practice is so ingrained in modern work culture that abandoning it feels almost impossible.`; confidence 0.9; Option F introduces a contradictory idea that disrupts the logical flow from digital distractions to monotasking; Option B provides a natural transition.

### seven_select-sp-kaoyan-9hunq0
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Scientific progress is often portrayed as a linear accumulation of knowledge, yet history reveals a far more complex reality. (1) This pattern challenges the conventional narrative
- Blank 5: current `1:Funding agencies now prioritize projects with clearly defined outcomes.` -> suggested `3:The resistance to new ideas can be as influential as the ideas themselves.`; confidence 0.9; Option B about funding priorities is irrelevant to the passage's concluding focus on embracing uncertainty and unexpected findings; option D directly supports the paradox discussed.

### seven_select-sp-kaoyan-9lp3cz
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of individuals have embraced digital minimalism, a lifestyle that advocates reducing screen time and curbing online distractions. (1) Yet beneath 
- Blank 4: current `3:Critics argue that digital minimalism is merely a privileged lifestyle choice unavailable to those in remote areas.` -> suggested `5:On the other hand, some researchers warn that reducing digital exposure might weaken our capacity for deep focus.`; confidence 0.9; D introduces a socioeconomic critique unrelated to the cognitive trade-offs discussed, breaking coherence; F directly contrasts the preceding benefits with a cognitive warning, fitting the argument flow.

### seven_select-sp-kaoyan-9q54se
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our hands, the boundary between online and offline existence grows increasingly porous. (1) This relentless connectivity, 
- Blank 5: current `5:Companies design these platforms specifically to maximize user engagement, often at the expense of user well-being.` -> suggested `4:Without such intentional practices, we risk becoming passive consumers of data rather than active shapers of our own thoughts.`; confidence 0.9; Option E directly follows the call for 'deliberate cultivation of digital mindfulness' and leads naturally to the concluding sentence about reclaiming cognitive autonomy, whereas Option F introduces an unrelated topic about platform design.

### seven_select-sp-kaoyan-aeen7y
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where instant messaging and social media dominate our daily routines, the concept of being constantly connected has become almost second nature. (1) However, beneath the 
- Blank 2: current `4:The digital world offers unparalleled convenience, but it also demands a cognitive tax that accumulates over time.` -> suggested `0:We find ourselves checking emails during conversations and scrolling through feeds while waiting in line.`; confidence 0.9; Option A provides concrete examples of constant partial attention that directly support the preceding 'brain drain' concept and lead into the next sentence about 'this phenomenon', while E is too general and does not connect locally.
- Blank 4: current `5:These micro-interruptions, though seemingly insignificant, collectively erode our ability to focus.` -> suggested `3:Even a brief glance at a notification can derail one's train of thought for up to 20 minutes.`; confidence 0.85; Option D provides a concrete, quantified example that fits the context of 'fragment deep work sessions' and leads naturally into the following dopamine discussion, while F is too general.

### seven_select-sp-kaoyan-bcp8yc
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of ourselves, the line between virtual and real interactions has blurred considerably. (1) This phenomenon, often celebrated 
- Blank 3: current `3:Without such boundaries, the boundary between work and personal life becomes increasingly porous.` -> suggested `2:C. Social media platforms are designed to be addictive, exploiting psychological vulnerabilities.`; confidence 0.85; No antecedent for 'such boundaries' in D; C logically follows the discussion of brain overload and digital design causing harm.

### seven_select-sp-kaoyan-bgtsfa
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In today's hyper-connected world, the average knowledge worker switches tasks every three minutes, a rhythm that fragments attention and erodes deep thinking. (1) This constant int
- Blank 3: current `0:Studies show that even a single glance at a notification can trigger a cascade of distracting thoughts.` -> suggested `6:Therefore, it is crucial for individuals to schedule regular digital detox periods to restore mental clarity.`; confidence 0.85; Option A is a general statement about notifications, but the context after the programmer example calls for a logical step toward countermeasures; Option G provides a fitting conclusion that leads into 'focus hours'.

### seven_select-sp-kaoyan-d6vygf
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, the concept of digital minimalism has gained considerable traction among tech-savvy professionals seeking to reclaim their time and focus. (1) However, a growing b
- Blank 1: current `0:Advocates argue that reducing screen time enhances mental well-being and productivity.` -> suggested `6:Yet the long-term effects of such a lifestyle remain underexplored in academic literature.`; confidence 0.9; The passage starts with digital minimalism's traction, then 'However' signals a contrast. Option G provides a contrastive research gap, while A merely states advocates' view without contrast.
- Blank 5: current `6:Yet the long-term effects of such a lifestyle remain underexplored in academic literature.` -> suggested `0:Advocates argue that reducing screen time enhances mental well-being and productivity.`; confidence 0.8; Blank 5 is the concluding sentence before 'Ultimately... weighing both advantages and drawbacks.' Option G is a research gap, not a conclusion. Option A presents the positive side, which contrasts with preceding drawbacks and leads naturally to the nuanced conclusion.

### seven_select-sp-kaoyan-dozokk
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a lifestyle philosophy that advocates reducing screen time and decluttering one’s digital life. Proponents argue that con
- Blank 4: current `6:This distinction is crucial for designing effective digital wellness interventions.` -> suggested `3:D. The key is to find a balance that works for each individual's unique circumstances.`; confidence 0.9; Option G's 'this distinction' lacks a clear antecedent, while Option D directly echoes the quality-over-quantity idea and leads naturally to the next sentence.

### seven_select-sp-kaoyan-ene180
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In today’s fast-paced digital environment, the ability to juggle multiple tasks simultaneously is often celebrated as a sign of efficiency and competence. Many professionals pride 
- Blank 3: current `6:Despite these findings, the glorification of multitasking persists in workplace culture.` -> suggested `2:Nevertheless, some people insist that they can multitask effectively without any negative consequences.`; confidence 0.85; G is too broad and disrupts local coherence; C provides a specific counterpoint that logically follows the evidence of harm and leads into the concern for students.

### seven_select-sp-kaoyan-flwpkg
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often equated with productivity, an increasing number of professionals are questioning the assumption that constant online presence is beneficial. (
- Blank 3: current `5:Without deliberate structure, digital tools can easily consume more time than intended.` -> suggested `6:Adopting a minimalist approach does not mean abandoning digital tools altogether.`; confidence 0.9; Option G directly introduces the idea that minimalism is not total abandonment, logically leading to the example of scheduling. Option F is too generic and does not connect to the preceding or following sentences.
- Blank 5: current `6:Adopting a minimalist approach does not mean abandoning digital tools altogether.` -> suggested `5:Without deliberate structure, digital tools can easily consume more time than intended.`; confidence 0.85; Option F provides a cautionary note about lack of structure, naturally leading to the conclusion that digital minimalism is about using technology as a tool. Option G would be redundant after the preceding discussion and does not fit as a lead-in to the conclusion.

### seven_select-sp-kaoyan-h1rmqm
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices dominate every waking moment, a growing number of individuals are embracing digital minimalism as a conscious countermeasure. (1) This philosophy ad
- Blank 4: current `3:Many people find it difficult to resist the lure of instant gratification provided by notifications and likes.` -> suggested `6:Nevertheless, the movement has gained traction among tech workers who are acutely aware of the industry's addictive design.`; confidence 0.9; Option D about resisting instant gratification is off-topic; the passage discusses critics' concerns and then a contrasting point. Option G provides a logical contrast with 'Nevertheless' and introduces tech workers, fitting the flow.

### seven_select-sp-kaoyan-h78dt6
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of daily life, a growing number of individuals are embracing a counterintuitive philosophy: digital minimalism. (1) This movem
- Blank 2: current `1:The irony, however, is that the very tools designed to connect us often leave us feeling more isolated.` -> suggested `2:C. By contrast, digital minimalists view technology as a tool to be used with purpose, not a master to be served.`; confidence 0.85; Option B introduces an ironic point that disrupts the flow; Option C directly contrasts the previous criticism of constant connectivity and leads naturally into the nomophobia example.
- Blank 5: current `5:Nevertheless, the appeal of digital minimalism continues to grow, with best-selling books and online communities dedicated to the practice.` -> suggested `6:G. Critics also point out that the movement’s emphasis on self-discipline can easily slip into moral judgment of others’ habits.`; confidence 0.9; Option F introduces a new positive point that weakens the concluding tone. Option G continues the critical perspective from blank 4 and leads naturally into the ultimate goal of reclaiming agency.

### seven_select-sp-kaoyan-hjvbv2
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, the concept of digital minimalism has gained considerable traction among professionals seeking to reclaim their time and mental space. (1) However, a growing body 
- Blank 3: current `5:This paradox suggests that the benefits of digital minimalism are not universal.` -> suggested `2:C. These findings challenge the assumption that less screen time always equals better mental health.`; confidence 0.85; Option F introduces a 'paradox' not yet established; Option C's 'These findings' links back to blank 2 and forward to blank 4's research.
- Blank 4: current `2:These findings challenge the assumption that less screen time always equals better mental health.` -> suggested `5:F. This paradox suggests that the benefits of digital minimalism are not universal.`; confidence 0.8; Option F's 'This paradox' logically follows the research in blank 4 and leads to the concluding balanced view; Option C is better placed earlier.

### seven_select-sp-kaoyan-hp2608
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, the concept of digital minimalism has gained considerable traction among professionals seeking to reclaim their time and mental clarity. The core premise is straig
- Blank 5: current `1:Yet the very act of stepping back from digital noise can paradoxically create a new kind of anxiety.` -> suggested `5:The key is to replace passive consumption with active creation, such as writing blogs or participating in meaningful discussions.`; confidence 0.9; B introduces unresolved anxiety, while F provides a practical solution that directly leads to the concluding sentence about conscious relationship with technology.

### seven_select-sp-kaoyan-j7vth9
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Urban greening projects, such as planting trees and creating parks, are widely celebrated for their environmental and social benefits. (1) However, recent studies reveal that these
- Blank 3: current `3:Similarly, a study in Barcelona showed that green roofs reduced energy consumption by up to 15%.` -> suggested `2:This displacement undermines the original purpose of greening, which is to improve overall well-being.`; confidence 0.95; The current option about Barcelona green roofs is off-topic; the passage focuses on displacement and inequality, and the suggested sentence logically follows the Portland example.

### seven_select-sp-kaoyan-jw1c6b
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones have become extensions of our hands, the boundary between work and personal life has grown increasingly porous. (1) This constant connectivity, while bo
- Blank 3: current `5:Without clear boundaries, employees find themselves responding to work emails late into the night.` -> suggested `4:However, the benefits of occasional digital detox are well-documented.`; confidence 0.9; The current sentence about late-night emails does not logically lead into the following study on email vacation; the suggested sentence directly introduces the benefits of digital detox.
- Blank 4: current `6:These findings challenge the assumption that constant availability is synonymous with dedication.` -> suggested `5:Without clear boundaries, employees find themselves responding to work emails late into the night.`; confidence 0.85; The sentence about 'right to disconnect' policies naturally follows the problem of lacking boundaries; the current sentence about challenging assumptions fits better after the study results.

### seven_select-sp-kaoyan-kotv42
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In modern consumer markets, the abundance of choices is often celebrated as a hallmark of freedom and prosperity. (1) This phenomenon has been extensively studied by psychologists 
- Blank 4: current `4:Consequently, retailers have begun to adopt a 'less is more' philosophy in their product displays.` -> suggested `3:D. Therefore, limiting options can paradoxically increase consumer confidence and sales.`; confidence 0.9; Blank 4 follows regret discussion; D provides logical conclusion before retailer action in blank 5.
- Blank 5: current `3:Therefore, limiting options can paradoxically increase consumer confidence and sales.` -> suggested `4:E. Consequently, retailers have begun to adopt a 'less is more' philosophy in their product displays.`; confidence 0.9; After D's conclusion, E naturally shows retailer implementation; current order reverses logic.

### seven_select-sp-kaoyan-m90dyp
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, deliberately reducing their screen time and online presence. (1) However, this seemingly liberating pr
- Blank 3: current `3:Digital minimalism advocates often cite improved focus and mental well-being as key benefits.` -> suggested `2:Many report that their offline relationships have actually deepened as a result.`; confidence 0.9; The passage discusses negative social consequences of digital minimalism; option D shifts to benefits, breaking the logical flow, while option C continues the theme of social impact and leads into the example.

### seven_select-sp-kaoyan-mhfg7y
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices permeate every aspect of daily life, a growing number of individuals are embracing digital minimalism—a conscious reduction in screen time and onlin
- Blank 3: current `4:These gatherings, though informal, often strengthen bonds that are crucial for long-term relationships.` -> suggested `2:C. Thus, digital minimalism is not merely a personal preference but a choice with interpersonal implications.`; confidence 0.9; Option E directly refers to 'these gatherings' and explains their importance, fitting the local context of missing spontaneous gatherings. The current answer C is a general concluding statement that fits better at blank 4.
- Blank 4: current `2:Thus, digital minimalism is not merely a personal preference but a choice with interpersonal implications.` -> suggested `4:E. These gatherings, though informal, often strengthen bonds that are crucial for long-term relationships.`; confidence 0.85; Blank 4 follows erosion of social ties and precedes a contrast; option C summarizes the interpersonal cost, while option E would have been better at blank 3.

### seven_select-sp-kaoyan-mz1nh2
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of individuals have embraced digital minimalism, a lifestyle that deliberately reduces screen time and online engagement. (1) However, a less disc
- Blank 5: current `2:One study found that heavy social media users experience higher levels of anxiety than moderate users.` -> suggested `3:The key is to strike a balance between digital detox and social participation.`; confidence 0.9; The passage concludes with relational costs of digital minimalism; a study about social media users' anxiety is off-topic, while option D offers a balanced conclusion that fits the paragraph's flow.

### seven_select-sp-kaoyan-p1chbv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital connectivity is often hailed as the cornerstone of modern life, its pervasive influence has begun to exact subtle yet profound tolls on human cognition. (1)
- Blank 1: current `2:Digital devices have undeniably revolutionized the way we access information and communicate with others.` -> suggested `0:We often pride ourselves on being able to multitask efficiently, but research suggests this is largely a myth.`; confidence 0.9; Option C is a neutral positive statement that does not set up the contrast needed after 'However'; Option A introduces the multitasking myth, which directly leads into the erosion of attention.
- Blank 5: current `0:We often pride ourselves on being able to multitask efficiently, but research suggests this is largely a myth.` -> suggested `6:Consequently, the quality of interpersonal relationships may also suffer as face-to-face interactions become more fragmented.`; confidence 0.85; Option A introduces a new topic (multitasking myth) not connected to the preceding or following sentences; Option G provides a logical consequence of fragmented attention, leading naturally to the countermeasure of digital detoxes.

### seven_select-sp-kaoyan-peak5j
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones have become extensions of our hands, the ability to maintain deep focus is increasingly rare. (1) This constant fragmentation of attention not only redu
- Blank 3: current `1:Many people now check their phones over 150 times per day.` -> suggested `5:The solution lies in redesigning our digital environments.`; confidence 0.9; Option B is a general statistic that does not connect to the preceding 'attention residue' or the following example about social media breaks; Option F provides a logical bridge to the 'focus hours' example in blank 4.

### seven_select-sp-kaoyan-pegi9x
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, the concept of a digital detox has gained considerable traction among urban professionals who feel overwhelmed by constant connectivity. (1) Yet a growing body of 
- Blank 1: current `0:Many proponents argue that disconnecting from screens can restore mental clarity and improve sleep quality.` -> suggested `2:However, the idea that a complete digital fast is universally beneficial has been increasingly challenged.`; confidence 0.9; The passage starts with the popularity of digital detox, then 'Yet' signals a contrast. Option A is a pro-detox statement, not a contrast. Option C directly challenges the universal benefit, fitting the 'Yet'.
- Blank 2: current `2:However, the idea that a complete digital fast is universally beneficial has been increasingly challenged.` -> suggested `0:Many proponents argue that disconnecting from screens can restore mental clarity and improve sleep quality.`; confidence 0.85; Blank 2 follows 'unintended psychological consequences' and precedes 'For instance, a 2022 study...'. The current option C is a general challenge, but the example needs a pro-detox claim to contrast with the study's finding. Option A provides that claim, making the study a counterexample.

### seven_select-sp-kaoyan-po2n9o
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often mistaken for productivity, a growing number of professionals are embracing a counterintuitive practice: digital minimalism. (1) However, its c
- Blank 2: current `0:It is not about living like a hermit or abandoning smartphones altogether.` -> suggested `2:Instead, they replace mindless scrolling with purposeful reading or skill-building.`; confidence 0.85; Option C directly continues the software engineer example by contrasting passive scrolling with active use, while A is a general clarification that fits better earlier.
- Blank 3: current `3:After a few weeks, however, most users report a renewed sense of clarity and control.` -> suggested `0:It is not about living like a hermit or abandoning smartphones altogether.`; confidence 0.8; After describing initial discomfort, the next logical step is to clarify what digital minimalism is not (A), before discussing later positive outcomes (D).
- Blank 4: current `4:This approach requires a clear understanding of one’s personal and professional priorities.` -> suggested `3:After a few weeks, however, most users report a renewed sense of clarity and control.`; confidence 0.85; Blank 4 follows initial discomfort; D provides the natural contrast of eventual positive outcome, while E is a general statement that fits better elsewhere.
- Blank 5: current `2:Instead, they replace mindless scrolling with purposeful reading or skill-building.` -> suggested `4:This approach requires a clear understanding of one’s personal and professional priorities.`; confidence 0.8; Blank 5 introduces the key distinction between passive and active; E about understanding priorities logically precedes that distinction, while C is a specific example better placed earlier.

### seven_select-sp-kaoyan-qipj39
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In the age of digital media, algorithms have become the invisible gatekeepers of information. They determine what news we see, what products we buy, and even whom we befriend onlin
- Blank 2: current `3:This tailored content, while convenient, can subtly narrow our worldview by excluding dissenting voices.` -> suggested `0:A. Consequently, users are often trapped in echo chambers where their own beliefs are constantly reinforced.`; confidence 0.85; Option D is too generic and does not logically follow the filter bubble definition; Option A directly continues the idea and leads into the example.
- Blank 3: current `6:The psychological comfort of confirmation bias makes it difficult for individuals to break out of these informational silos.` -> suggested `3:D. This tailored content, while convenient, can subtly narrow our worldview by excluding dissenting voices.`; confidence 0.8; Option G is a general psychological statement that fits better later; Option D directly refers back to the algorithmic tailoring just described and fits the flow.
- Blank 4: current `2:However, such measures have met with mixed success, as users often resist content that challenges their worldview.` -> suggested `6:G. The psychological comfort of confirmation bias makes it difficult for individuals to break out of these informational silos.`; confidence 0.75; Option C is about measures and fits better after regulation; Option G explains why users resist serendipity features, providing a logical cause.

### seven_select-sp-kaoyan-raesvn
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, deliberately reducing their screen time and online presence. (1) However, this seemingly liberating pr
- Blank 1: current `0:Advocates argue that this shift improves mental health and deepens real-world relationships.` -> suggested `1:Yet the irony is that their absence from digital spaces can inadvertently create distance in those same relationships.`; confidence 0.9; The passage's 'However' requires a contrasting point; Option A is positive and contradicts the negative tone, while B provides the needed contrast.
- Blank 4: current `4:Digital platforms, for all their flaws, have become the primary infrastructure for modern social coordination.` -> suggested `2:Many people find it difficult to maintain such a lifestyle due to work or social pressure.`; confidence 0.85; The paradox requires an explanation of why the tension exists; Option C directly addresses difficulty maintaining minimalism, while E is a general statement that does not connect to the paradox.

### seven_select-sp-kaoyan-rhdyyb
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In today’s fast-paced academic environment, many students pride themselves on their ability to juggle multiple tasks simultaneously. They check emails while attending lectures, scr
- Blank 2: current `2:When information overload occurs, the brain struggles to filter out irrelevant stimuli, causing key details to be missed.` -> suggested `1:For example, a student who checks social media every ten minutes may take twice as long to finish a reading assignment.`; confidence 0.9; Option C is a general statement about information overload, but blank 2 needs a concrete example to bridge the switching penalty and the Stanford study. Option B provides that example.
- Blank 3: current `5:This phenomenon is particularly evident in the workplace, where employees are expected to respond to emails instantly.` -> suggested `2:When information overload occurs, the brain struggles to filter out irrelevant stimuli, causing key details to be missed.`; confidence 0.85; Option F shifts to workplace context, breaking the cause-effect chain from limited working memory. Option C logically explains the consequence of limited working memory.
- Blank 5: current `4:Participants reported significant improvements in comprehension and retention.` -> suggested `6:In contrast, a quiet environment without digital distractions can significantly boost focus.`; confidence 0.9; Option E introduces 'participants' without prior reference, creating a dangling reference. Option G provides a logical contrast to multitasking and supports the workshop concept.

### seven_select-sp-kaoyan-s8hr0v
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a lifestyle philosophy that advocates reducing screen time and curbing online distractions. (1) Yet a growing body of res
- Blank 1: current `0:However, the effectiveness of such extreme measures remains hotly debated among psychologists and tech ethicists.` -> suggested `5:Many proponents of digital minimalism claim it enhances focus and overall well-being.`; confidence 0.9; Option A's 'such extreme measures' has no antecedent; Option F introduces proponents' claims that contrast with the following 'Yet' sentence.
- Blank 3: current `5:Many proponents of digital minimalism claim it enhances focus and overall well-being.` -> suggested `0:However, the effectiveness of such extreme measures remains hotly debated among psychologists and tech ethicists.`; confidence 0.85; Option F is a general proponent claim that disrupts the critical flow about social isolation and detox studies; Option A logically continues the critical perspective.

### seven_select-sp-kaoyan-uou6y5
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often equated with productivity, a growing number of professionals are questioning the assumption that constant digital engagement is beneficial. (1
- Blank 2: current `0:Many employees report feeling overwhelmed by the sheer volume of notifications and messages they receive daily.` -> suggested `3:The key is to distinguish between essential communication and mere digital clutter.`; confidence 0.85; Current sentence is too general and does not connect to the cognitive cost concept; option D provides a logical bridge.
- Blank 3: current `6:To counteract this, advocates suggest setting strict boundaries for technology use.` -> suggested `0:Many employees report feeling overwhelmed by the sheer volume of notifications and messages they receive daily.`; confidence 0.8; Current sentence is abrupt; option A provides a concrete consequence of multitasking that leads to the advocates' proposal.

### seven_select-sp-kaoyan-uri3ls
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, deliberately reducing their screen time and social media usage. (1) Yet this seemingly beneficial life
- Blank 5: current `5:Digital minimalism has been widely praised for improving mental health and productivity.` -> suggested `0:A. The researchers emphasize that digital detox programs should be customized rather than one-size-fits-all.`; confidence 0.85; Option F is a general praise statement that belongs earlier; blank 5 concludes with a call for thoughtful substitution, and option A directly supports that by advocating customization, fitting the concluding logic.

### seven_select-sp-kaoyan-vgcxy8
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where information is abundant and attention spans are shrinking, the phenomenon of digital distraction has become a pressing concern for educators and employers alike. (1
- Blank 3: current `1:This constant connectivity has been linked to increased rates of anxiety and depression among young adults.` -> suggested `2:C. Some companies have even introduced 'focus hours' during which all non-essential notifications are silenced.`; confidence 0.85; Option B introduces a new topic (anxiety/depression) that breaks the logical flow from the study example to the solution discussion; Option C provides a coherent intermediate step.

### seven_select-sp-kaoyan-vxszdj
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often equated with productivity, a growing number of professionals are beginning to question the relentless pursuit of digital engagement. (1) This 
- Blank 1: current `0:Many have found that the key to breaking this cycle is to schedule specific times for checking emails and social media.` -> suggested `3:By consciously limiting digital distractions, individuals can restore their capacity for sustained attention.`; confidence 0.9; Option A refers to 'this cycle' without an antecedent, while D directly defines digital minimalism.
- Blank 2: current `3:By consciously limiting digital distractions, individuals can restore their capacity for sustained attention.` -> suggested `0:Many have found that the key to breaking this cycle is to schedule specific times for checking emails and social media.`; confidence 0.85; Blank 2 follows fragmented attention; A offers a practical solution to break the cycle, while D is a general statement better placed earlier.

### seven_select-sp-kaoyan-vzdtz2
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of individuals have embraced digital minimalism, a lifestyle that deliberately reduces screen time to reclaim focus and mental well-being. (1) Yet
- Blank 3: current `4:The key lies in setting clear boundaries—such as designated ‘tech-free’ hours—while maintaining selective engagement with platforms that genuinely add value.` -> suggested `2:C. Therefore, digital minimalism should be adopted gradually rather than as a sudden, drastic change.`; confidence 0.85; Option C provides a logical conclusion after the paradox and example, while E introduces a premature solution.
- Blank 5: current `3:Those who succeed in this practice typically replace digital consumption with offline activities such as reading, exercising, or face-to-face conversations.` -> suggested `5:F. Without these supporting structures, the digital detox may become a source of stress rather than relief.`; confidence 0.9; F directly follows the need for adjustments and leads into the concluding sentence, while D introduces an unprepared new idea.

### seven_select-sp-kaoyan-xflnka
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The academic publishing landscape has undergone a seismic shift over the past two decades, driven largely by digital technologies and changing expectations from both researchers an
- Blank 5: current `6:Some fear that the rush to publish quickly may undermine the thoroughness of scientific validation.` -> suggested `4:They must also weigh the benefits of sharing data early against the risk of being scooped or making errors public.`; confidence 0.9; Option E directly continues the pronoun 'they' and addresses early-career researchers' specific challenges, while Option G is a general statement that disrupts coherence.

### seven_select-sp-kaoyan-y4tdot
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In today’s hyperconnected world, the ability to juggle multiple tasks simultaneously is often celebrated as a hallmark of efficiency. (1) Yet a growing body of cognitive research s
- Blank 2: current `2:Consequently, even brief interruptions can extend the total time needed to complete a complex project by up to 40 percent.` -> suggested `1:However, this apparent efficiency comes at a hidden price that most users fail to recognize.`; confidence 0.85; Blank 2 follows a general claim about cognitive costs; a contrastive transition fits better than a specific consequence lacking clear antecedent.
- Blank 4: current `5:Interestingly, some individuals believe they are exceptional multitaskers, yet objective tests often reveal they are merely more confident, not more competent.` -> suggested `3:Similarly, a 2019 study found that heavy multitaskers performed worse on tests of attention control than those who focused on one task at a time.`; confidence 0.8; Blank 4 follows a specific example of attention residue; a supporting study is more coherent than a general observation about self-perception.

### seven_select-sp-中考-11frk59
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My parents and I planned to give her a surprise. (1) We decided to make a photo album for her. It was not expensive, but it was full
- Blank 5: current `0:We bought a big cake from the store.` -> suggested `-1:`; confidence 0.95; The passage ends with the grandmother's reaction and the author's reflection; inserting a cake purchase after that breaks coherence and is irrelevant.

### seven_select-sp-中考-13b9r7y
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Mother’s Day. Tom wanted to give his mom a special gift. (1) He went to a flower shop and saw many beautiful flowers. (2) The shopkeeper told him that roses were expensive. 
- Blank 2: current `0:Tom felt very sad because he had no money.` -> suggested `1:Tom thought for a while and had a better idea.`; confidence 0.9; Tom has five dollars, so 'no money' is false; after hearing roses are expensive, he would logically think of an alternative.
- Blank 3: current `1:Tom thought for a while and had a better idea.` -> suggested `0:Tom felt very sad because he had no money.`; confidence 0.85; After deciding to make a card, sadness about money is irrelevant; the idea of making a card is already a positive plan.
- Blank 5: current `2:Tom bought a rose for his mother at last.` -> suggested `-1:`; confidence 0.95; The story ends with the card as the gift; buying a rose contradicts the narrative and is unsupported.

### seven_select-sp-中考-13gqloh
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my parents and I went to my grandparents’ house in the countryside. The weather was fine and the air smelled fresh. (1) My grandpa smiled and said, “Let me show you so
- Blank 3: current `4:I wanted to buy one for myself.` -> suggested `2:The plant grew taller day by day.`; confidence 0.9; After grandpa says it will bloom in a few days, the natural next step is to describe the plant's growth, not to express a desire to buy one.
- Blank 4: current `3:A week later, the bud opened into a beautiful red flower.` -> suggested `2:The plant grew taller day by day.`; confidence 0.85; The sentence about the bud opening should come after the plant has grown, not before the daily care routine. The current order breaks temporal sequence.
- Blank 5: current `2:The plant grew taller day by day.` -> suggested `3:A week later, the bud opened into a beautiful red flower.`; confidence 0.9; After daily care, the natural climax is the flower blooming, which leads to the lesson about patience and love.

### seven_select-sp-中考-13hs8h2
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was Mother’s Day. Tom and his sister Lily wanted to do something special for their mom. (1) They decided to make breakfast and a card. Tom was good at cooking eggs, and
- Blank 5: current `4:Lily carefully placed the card beside the plate.` -> suggested `-1:`; confidence 0.95; The card placement logically belongs before Mom sees the gift, not after she has already praised it.

### seven_select-sp-中考-149y4cm
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my 15th birthday. I thought I would get a new phone or a cool pair of sneakers. (1) My parents smiled and handed me a small box. Inside was not a phone or sneakers,
- Blank 4: current `0:I thanked them and said it was the best birthday ever.` -> suggested `6:They taught me a lesson I will never forget.`; confidence 0.9; Thanking for a disappointing gift is premature here; the lesson sentence fits the reflective tone after seeing sprouts.
- Blank 5: current `6:They taught me a lesson I will never forget.` -> suggested `0:I thanked them and said it was the best birthday ever.`; confidence 0.9; The lesson sentence belongs earlier; thanking is a natural conclusion after learning the lesson.

### seven_select-sp-中考-154info
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was Mother’s Day. Tom wanted to give his mother a special gift, but he had no money. (1) He looked around the house and found some colored paper, glue and old buttons. 
- Blank 4: current `4:His mother was not at home that day.` -> suggested `0:His mother put the card on the table.`; confidence 0.95; Mother is present and hugging Tom, so 'not at home' contradicts the context.

### seven_select-sp-中考-155g17s
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my 15th birthday. I woke up early but found the house very quiet. (1) I walked into the living room and saw a big box on the table. (2) I opened it carefully and 
- Blank 4: current `4:From that day on, I started to learn to play the guitar.` -> suggested `2:They told me it was a gift they chose together.`; confidence 0.9; After the hug, the parents' explanation of the gift fits naturally before the daily practice; the current key is a summary of later events and breaks the sequence.
- Blank 5: current `5:My friends came to my party in the afternoon.` -> suggested `4:From that day on, I started to learn to play the guitar.`; confidence 0.9; The current key introduces an unmentioned party, disrupting the logical flow from gift to practice; the suggested option directly leads into 'I practiced every day'.

### seven_select-sp-中考-162fz0t
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my mother asked me to help her in the garden. She wanted to plant some flowers. (1) I was not very happy because I wanted to play computer games. But I still went outs
- Blank 3: current `3:It flew into the sky and I smiled happily.` -> suggested `6:G. The bird looked at us and seemed to say thanks.`; confidence 0.95; The bird is still weak and in the box; it cannot fly yet. 'The bird looked at us' fits better after giving it water and bread.
- Blank 4: current `6:The bird looked at us and seemed to say thanks.` -> suggested `3:D. It flew into the sky and I smiled happily.`; confidence 0.95; After the bird becomes stronger and moves its wings, the next logical step is it flying away, not looking at us again.
- Blank 5: current `4:I didn't know what to do with the bird.` -> suggested `5:F. Finally, my mother agreed to let me play games.`; confidence 0.9; The story ends with releasing the bird and a meaningful day; 'didn't know what to do' is irrelevant and contradicts the resolved action. 'Finally, my mother agreed to let me play games' provides a natural closing after the meaningful experience.

### seven_select-sp-中考-16ffiiq
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom and his dad went to the city park. They wanted to fly a kite because it was a sunny day with a gentle wind. (1) So they walked to the open grass field near the l
- Blank 2: current `3:His dad said, “Don’t worry, I’ll get it.”` -> suggested `6:G. His dad climbed up the tree carefully and got the kite down.`; confidence 0.9; The dad's immediate action fits better after the kite gets stuck; a promise delays resolution awkwardly.
- Blank 3: current `6:His dad climbed up the tree carefully and got the kite down.` -> suggested `3:D. His dad said, “Don’t worry, I’ll get it.”`; confidence 0.9; After the dad's promise in blank 2, blank 3 should show the action; swapping restores logical sequence: promise then action.

### seven_select-sp-中考-16pand4
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousins and I wanted to give her a special gift. (1) We thought about buying a cake or a dress, but they were too common. (2) She
- Blank 2: current `4:After much discussion, an idea suddenly came to us.` -> suggested `0:Finally, we decided to make a small garden for her.`; confidence 0.9; The current 'idea came to us' is vague and does not logically follow 'too common'; the suggested option directly states the decision to make a garden, which fits the context of 'She loves flowers'.
- Blank 3: current `1:We went to the store and chose some beautiful roses.` -> suggested `4:After much discussion, an idea suddenly came to us.`; confidence 0.85; After deciding to make a garden, the next step is to have the idea, not to buy roses; the suggested option bridges the decision and the subsequent action of buying seeds.
- Blank 5: current `3:She opened the box and found a new pair of shoes.` -> suggested `5:Every day she waters them and watches them grow.`; confidence 0.95; The passage ends with 'best gift' referring to the garden; 'waters them' maintains the garden theme, while shoes are irrelevant and break coherence.

### seven_select-sp-中考-16zizyr
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you often feel tired during the day? Maybe you are not getting enough good sleep. (1) Here are some simple tips to help you sleep better. First, keep a regular sleep schedule. G
- Blank 1: current `2:Many people have trouble falling asleep at night.` -> suggested `0:Good sleep is important for our health.`; confidence 0.9; Option C is a general statement that does not connect the opening complaint to the upcoming tips; Option A provides a logical bridge by affirming the importance of sleep before offering advice.
- Blank 5: current `6:They can make it harder to fall asleep.` -> suggested `5:Exercising during the day can also improve your sleep.`; confidence 0.9; Option G's 'They' has no clear plural antecedent (heavy meals and coffee are not naturally grouped as 'they'), and the sentence is redundant after the advice to avoid them. Option F introduces a new, relevant tip that fits the pattern of the passage.

### seven_select-sp-中考-1731qlq
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I took out some colored paper and drew a b
- Blank 1: current `0:Then I found a beautiful card in a shop.` -> suggested `5:I thought about buying a gift, but I had no idea.`; confidence 0.95; The passage states 'I had no money', so buying a card contradicts that; option F logically leads to making a card.
- Blank 5: current `3:Finally, I chose a toy for her.` -> suggested `-1:`; confidence 0.9; The story ends with the homemade card as the gift; choosing a toy contradicts the narrative and is out of place.

### seven_select-sp-中考-17is9qf
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my 15th birthday. I expected to get a new phone as a gift, but my parents gave me something different. (1) I tried to hide my disappointment, but my mother notice
- Blank 5: current `3:I put the book aside and played with my phone.` -> suggested `4:That evening, I stayed up late reading the book.`; confidence 0.95; The passage ends with gratitude for the book; putting it aside contradicts the positive resolution.

### seven_select-sp-中考-1822hy8
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousins and I wanted to give her something special. (1) We thought about buying a cake or flowers, but they seemed too common. Th
- Blank 3: current `5:Grandma was surprised and hugged each of us.` -> suggested `2:We wanted to make her happy on her special day.`; confidence 0.9; The hugging reaction should come after she opens the album and reacts emotionally, not before. The current placement interrupts the sequence.
- Blank 4: current `2:We wanted to make her happy on her special day.` -> suggested `5:Grandma was surprised and hugged each of us.`; confidence 0.9; After she says it's the best gift, a hugging reaction is natural. The current sentence is a general intention that fits better earlier.

### seven_select-sp-中考-19bawy9
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousin and I wanted to give her a special gift. (1) We decided to make a photo album by ourselves. First, we collected all the ol
- Blank 2: current `2:We found many funny pictures of her when she was young.` -> suggested `0:We spent the whole afternoon working on it.`; confidence 0.9; Finding pictures belongs after collecting photos, not after buying supplies; current placement breaks logical sequence.

### seven_select-sp-中考-19m2160
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother's birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I took out a piece of white paper and some
- Blank 2: current `0:I went to the store and bought a card.` -> suggested `3:I also added a small poem at the bottom.`; confidence 0.95; The writer had no money, so buying a card contradicts the context. Adding a poem logically follows drawing and writing.
- Blank 5: current `3:I also added a small poem at the bottom.` -> suggested `5:She smiled and thanked me again.`; confidence 0.9; The poem addition should occur before hiding the card, not after the mother's reaction. The mother's smile and thanks fit after she hugs and speaks.

### seven_select-sp-中考-1b3uam0
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my birthday. I didn’t expect anything special because my parents were busy with work. (1) When I opened the door, I saw a big box on the table. (2) I was so curio
- Blank 4: current `0:However, they gave me a big surprise.` -> suggested `3:From that day on, the dog became my best friend.`; confidence 0.9; The surprise has already been revealed; 'However, they gave me a big surprise' is out of place here. The suggested sentence provides a natural conclusion before the daily walk.

### seven_select-sp-中考-1bhzsgy
- Type: seven_select; exam: 中考; level: lv1
- Passage: First impressions are very important. They can influence how people think of you. (1) Here are some simple tips to help you. First, smile when you meet someone. (2) It makes you lo
- Blank 1: current `3:It is not easy to change a bad first impression.` -> suggested `5:A friendly smile is a great way to start.`; confidence 0.9; D is a general statement about changing impressions, not a transition to tips; F directly introduces the list.

### seven_select-sp-中考-1cyitew
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. He wanted to plant some flowers there. (1) He put on his gloves and took a small shovel. The sun was warm and the birds
- Blank 4: current `0:He worked hard and soon felt tired.` -> suggested `6:They wondered what else could be in the box.`; confidence 0.9; After finding a letter inside the box, the logical next step is to wonder about further contents, not to feel tired from unmentioned work.

### seven_select-sp-中考-1e6e3mj
- Type: seven_select; exam: 中考; level: lv1
- Passage: Everyone wants to be happy, but not everyone knows how to find happiness. (1) Some people think money can bring happiness, but they are wrong. In fact, happiness comes from small t
- Blank 3: current `5:Just take a walk in the park and feel the fresh air.` -> suggested `2:A kind word from a friend can also make your day.`; confidence 0.85; The blank follows examples of small joys like reading and music; a kind word is a parallel small pleasure, while a walk is more active and less fitting.
- Blank 4: current `4:Instead, they are always running after money and success.` -> suggested `5:Just take a walk in the park and feel the fresh air.`; confidence 0.9; The blank introduces advice to slow down; 'take a walk' directly supports that, while 'running after money' contradicts the positive suggestion.

### seven_select-sp-中考-1ek3og1
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom is a middle school student. He loves science and often reads books about robots. Last month, his school held a science fair. (1) He wanted to make a robot that could help with 
- Blank 2: current `2:The robot could really work.` -> suggested `6:G. The teacher gave him some advice on the design.`; confidence 0.95; The teacher's advice logically follows the teacher's positive comment, before building.
- Blank 5: current `4:He wanted to make a robot that could talk.` -> suggested `-1:`; confidence 0.9; The option introduces an irrelevant new desire, breaking the concluding coherence.

### seven_select-sp-中考-1ffzzz9
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Saturday morning. Tom and his sister Lily wanted to do something special for their mother. (1) They decided to make breakfast for her. Tom got the bread and eggs from the fr
- Blank 3: current `5:Their mother was still sleeping in bed.` -> suggested `4:After that, they cleaned the kitchen together.`; confidence 0.9; Mother sleeping breaks the sequence; cleaning fits after food prep.
- Blank 4: current `1:Tom made a sandwich for himself.` -> suggested `5:Their mother was still sleeping in bed.`; confidence 0.85; Tom making a sandwich for himself is irrelevant; mother asleep before they shout is logical.

### seven_select-sp-中考-1fj1ago
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Saturday morning. Tom and his sister Lily wanted to do something special for their mother. (1) They decided to make breakfast for her. Tom got the bread and eggs, while Lily
- Blank 5: current `2:Mom was still sleeping in her bedroom.` -> suggested `-1:`; confidence 0.95; Mom has already woken up, been surprised, and hugged the children; placing 'Mom was still sleeping' after that breaks chronological order and coherence.

### seven_select-sp-中考-1foohep
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s birthday. My cousins and I wanted to give her something special. (1) We decided to make a photo album together. First, we collected photos from dif
- Blank 5: current `0:We bought a new camera for her.` -> suggested `2:Everyone enjoyed looking at the old pictures.`; confidence 0.9; Buying a camera contradicts the handmade gift theme and the final lesson about love and time; the suggested option logically follows Grandma watching the video.

### seven_select-sp-中考-1g4haua
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you often feel tired during the day? A good night’s sleep can help you stay healthy and happy. (1) Here are some tips that may help you sleep better. First, keep a regular sleep
- Blank 3: current `6:A clean room helps you feel more relaxed.` -> suggested `3:Drinking warm milk might help you relax.`; confidence 0.85; The paragraph focuses on bedroom comfort (dark, quiet, cool, comfortable bed/pillow); a clean room is not mentioned, while warm milk is a common relaxation aid that fits the context.
- Blank 4: current `5:Try to finish your dinner at least two hours before bedtime.` -> suggested `3:Drinking warm milk might help you relax.`; confidence 0.9; Blank 4 follows advice to avoid electronics and suggests alternatives like reading or soft music; warm milk is a natural relaxation method, while the dinner timing tip belongs to blank 5.
- Blank 5: current `2:A heavy meal can make you sleep badly.` -> suggested `5:Try to finish your dinner at least two hours before bedtime.`; confidence 0.8; Blank 5 is the final tip about not eating too much; the current key is a general statement, but the suggested option provides specific actionable advice consistent with the pattern of other tips.

### seven_select-sp-中考-1gdggjo
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last month, our school held a sports day. I took part in the relay race with my classmates. (1) We practiced every day after school. At first, we often dropped the baton. (2) Our c
- Blank 3: current `4:Everyone cheered for us and we felt proud.` -> suggested `6:G. I still remember the smile on my teammates' faces.`; confidence 0.9; Blank 3 is before the race starts; cheering and pride belong after the race, not before. G fits better as a reflective closing after the race.
- Blank 4: current `6:I still remember the smile on my teammates' faces.` -> suggested `4:E. Everyone cheered for us and we felt proud.`; confidence 0.9; After winning second place, the natural next sentence is about cheering and pride, not a memory of smiles which fits better at the end.
- Blank 5: current `0:We felt very sad and wanted to give up.` -> suggested `6:G. I still remember the smile on my teammates' faces.`; confidence 0.95; After winning second place and learning a positive lesson, feeling sad and wanting to give up contradicts the tone. G provides a positive reflective ending.

### seven_select-sp-中考-1gl1apa
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Saturday morning. Tom and his sister Lily wanted to do something special for their mother. (1) They decided to make breakfast for her. Tom got some eggs and bread from the f
- Blank 3: current `3:Lily set the table with plates and cups.` -> suggested `6:They also made two cups of tea for her.`; confidence 0.9; The passage describes putting food on a tray and adding a flower; setting a table with plates and cups is inconsistent with the tray context, while making tea logically follows cooking and cutting.

### seven_select-sp-中考-1i1cc09
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother's birthday. My cousin and I decided to make a special gift for her. (1) We thought she would love a homemade card. First, we bought some colorful pap
- Blank 2: current `1:It took us about two hours to finish the card.` -> suggested `4:Finally, we put the card into an envelope.`; confidence 0.9; After writing and drawing, the logical next step is to put the card into an envelope, not to state the time taken.
- Blank 3: current `5:I was a little worried that she might not like it.` -> suggested `1:It took us about two hours to finish the card.`; confidence 0.85; The time taken fits after describing the making process; worry about liking it should come after finishing and before giving.
- Blank 4: current `6:My grandmother was very surprised.` -> suggested `5:I was a little worried that she might not like it.`; confidence 0.9; Worry naturally precedes opening the card; 'surprised' fits better after she opens and smiles.
- Blank 5: current `2:She said it was the best birthday gift she had ever received.` -> suggested `6:My grandmother was very surprised.`; confidence 0.95; The current key repeats the passage's final line; 'surprised' shows her reaction after opening.

### seven_select-sp-中考-1i51coh
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I didn’t have much money. (1) I decided to make a card by myself. I got some colored paper, scisso
- Blank 3: current `0:I spent all my pocket money on a new dress.` -> suggested `4:She also showed it to all her friends.`; confidence 0.95; The passage is about making a card, not buying a dress; after the hug, showing the card to friends is logical.

### seven_select-sp-中考-1i8lu5u
- Type: seven_select; exam: 中考; level: lv1
- Passage: A smile is a small thing, but it can make a big difference. (1) When you smile at someone, it shows that you are friendly and kind. (2) For example, if you smile at a new classmate
- Blank 4: current `4:Sometimes you may find it hard to smile.` -> suggested `6:In fact, smiling uses fewer muscles than frowning.`; confidence 0.9; G provides a logical reason supporting the advice to smile more, while E introduces an unsupported difficulty.
- Blank 5: current `6:In fact, smiling uses fewer muscles than frowning.` -> suggested `4:Sometimes you may find it hard to smile.`; confidence 0.85; E offers a realistic contrast that enriches the concluding metaphor, whereas G is better placed earlier and disrupts the flow here.

### seven_select-sp-中考-1ick2pt
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last month, our school organized a trip to the science museum. (1) We saw many interesting exhibits, such as a robot that could play chess and a model of the solar system. (2) The 
- Blank 2: current `1:I was most surprised by the robot.` -> suggested `5:We also watched a short film about space travel.`; confidence 0.85; The passage lists exhibits; a personal reaction breaks the objective sequence, and the film fits the museum context better.
- Blank 4: current `4:Some students took many photos of the exhibits.` -> suggested `3:My favorite was the experiment about making a battery.`; confidence 0.9; The battery-making sentence logically follows a mention of that experiment; photos are irrelevant here.

### seven_select-sp-中考-1j0linp
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Saturday morning. Tom and his sister Lily wanted to do something special for their mother. (1) They decided to make breakfast for her. Tom got the bread and eggs ready, whil
- Blank 1: current `2:Their mother was sleeping in her bedroom.` -> suggested `5:They wanted to give her a nice surprise.`; confidence 0.95; The sentence about the mother sleeping is abrupt and breaks the logical flow; the suggested option directly explains the motivation for making breakfast.
- Blank 5: current `4:Tom broke an egg into a bowl.` -> suggested `3:She smiled and hugged them.`; confidence 0.9; After the mother is not angry, her smiling and hugging is the natural reaction, whereas Tom breaking an egg is out of sequence and disrupts the narrative.

### seven_select-sp-中考-1j6p178
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I didn't expect any big celebration because my parents were busy with work. (1) When I opened the door, I saw a small box on the table. It was wrapped 
- Blank 2: current `2:I wondered who had left it there.` -> suggested `1:B. To my surprise, there was a note from my mom saying she loved me.`; confidence 0.9; The note from mom is already revealed in blank 1, so wondering who left it is incoherent; blank 2 should continue the reaction to the box.
- Blank 3: current `3:We had a wonderful time together.` -> suggested `2:C. I wondered who had left it there.`; confidence 0.85; Blank 3 is still before Tom arrives; 'we had a wonderful time' is premature. Wondering about the box fits better after unwrapping.
- Blank 4: current `4:I put the notebook on the shelf and never used it.` -> suggested `3:D. We had a wonderful time together.`; confidence 0.95; After Tom arrives and brings cake, the natural flow is to describe the time together, not to put the notebook away.

### seven_select-sp-中考-1jikyss
- Type: seven_select; exam: 中考; level: lv1
- Passage: Many students think the best way to learn is to listen to the teacher carefully in class. (1) However, studies show that teaching others can help you remember better. When you expl
- Blank 5: current `0:Listening is the only way to get good grades.` -> suggested `6:Trying this method can make learning more fun and effective.`; confidence 0.95; The passage promotes teaching as a learning method; the current key contradicts the theme, while the suggested option aligns with the concluding encouragement.

### seven_select-sp-中考-1k33fw
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was Tom’s 14th birthday. He woke up early, feeling excited. (1) He walked into the living room and saw a big box on the table. (2) He opened the box carefully and fou
- Blank 3: current `1:He decided to give his parents a surprise.` -> suggested `2:C. He was surprised and asked how they knew.`; confidence 0.9; After father's explanation, Tom's surprise and question is the logical reaction; deciding to give a surprise is out of place.
- Blank 4: current `3:The card said “Thank you and I love you!”` -> suggested `1:B. He decided to give his parents a surprise.`; confidence 0.85; Tom runs to get a card he made; the decision to surprise them fits before presenting it, not the card's content.
- Blank 5: current `4:He thought it might be a new pair of shoes.` -> suggested `3:D. The card said “Thank you and I love you!”`; confidence 0.9; After Tom returns with the card, stating what it says is the natural next detail; earlier shoe speculation is out of sequence.

### seven_select-sp-中考-1k688xk
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, Tom decided to help his mother in the garden. He put on his gloves and took a small shovel. (1) He wanted to plant some flowers for his mom’s birthday. Suddenly, his s
- Blank 5: current `2:He remembered his grandfather’s kind smile.` -> suggested `4:She said it was a gift from Grandpa that had been lost for years.`; confidence 0.9; After the mother's surprised and happy reaction, her explanation of the lost gift fits naturally, while remembering the grandfather's smile is out of place and breaks the narrative sequence.

### seven_select-sp-中考-1kdn02o
- Type: seven_select; exam: 中考; level: lv1
- Passage: When you meet someone for the first time, you want to make a good impression. (1) Here are some simple tips to help you. First, always smile. A smile shows that you are friendly an
- Blank 4: current `5:This helps you know them better.` -> suggested `2:This shows respect and helps you understand better.`; confidence 0.9; Option C directly explains the benefit of not interrupting, while F is less relevant to the preceding instruction.

### seven_select-sp-中考-1korklr
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, I helped my grandpa in his garden. He asked me to water the flowers and pull out the weeds. (1) I was surprised to find a small, green box under a big sunflower. I o
- Blank 3: current `3:Inside the box, there was a beautiful red flower.` -> suggested `1:I took out a small toy car and a photo of my grandpa and me.`; confidence 0.9; The note inside the box says 'For my dear grandson', so the box should contain a personal keepsake like a toy car and photo, not a flower. A flower is less coherent with the narrative and the grandson's reaction.

### seven_select-sp-中考-1nllsyr
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, I helped my grandpa in his garden. He asked me to water the flowers and pull out some weeds. (1) Suddenly, I saw something shiny under a big sunflower. (2) I called 
- Blank 2: current `4:Then I noticed a small, round object near the roots.` -> suggested `0:I was curious and bent down to look carefully.`; confidence 0.9; After seeing something shiny, the natural next step is curiosity and bending down, not noticing another object.
- Blank 3: current `3:I put it into my pocket.` -> suggested `4:Then I noticed a small, round object near the roots.`; confidence 0.9; After bending down, noticing the object logically precedes putting it in pocket.
- Blank 4: current `1:We decided to take it to a museum.` -> suggested `3:I put it into my pocket.`; confidence 0.85; After digging out the coin, putting it in pocket is natural before grandpa's story; museum decision is premature.

### seven_select-sp-中考-1nmgfd9
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) So I decided to make a card by myself. I took out a piece of paper and some co
- Blank 1: current `2:I wanted to buy a gift from the store.` -> suggested `-1:`; confidence 0.95; Contradicts 'I had no money' and disrupts logical flow to making a card.

### seven_select-sp-中考-1nsyioq
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom was a quiet boy who loved drawing. He often sat in the corner of the classroom, drawing pictures of trees and birds. (1) He wanted to give his mother something special for her 
- Blank 2: current `2:Tom felt very happy.` -> suggested `6:He spent two weeks on the drawing.`; confidence 0.9; The decision to draw a big picture logically leads to stating the time spent, not an emotional result.
- Blank 3: current `6:He spent two weeks on the drawing.` -> suggested `2:Tom felt very happy.`; confidence 0.85; After working daily and using favorite colors, the emotional result naturally follows; repeating time spent is redundant.
- Blank 5: current `3:Tom’s father bought him a new pencil.` -> suggested `2:Tom felt very happy.`; confidence 0.95; The story concludes with Tom's feeling and the lesson; the father buying a pencil is irrelevant and breaks coherence.

### seven_select-sp-中考-1oxoti3
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, I helped my grandma in her garden. She showed me how to water the flowers and pull out the weeds. (1) I was surprised and asked where it came from. Grandma smiled and 
- Blank 3: current `3:A few weeks later, the tomato turned red.` -> suggested `2:I thought it was a good idea.`; confidence 0.9; After deciding to take care of the plant, a reaction like 'I thought it was a good idea' is logical, while the current key jumps ahead to the tomato turning red.
- Blank 4: current `4:It tasted so sweet!` -> suggested `3:A few weeks later, the tomato turned red.`; confidence 0.85; The sequence requires the tomato to ripen before picking and tasting; the current key has tasting before picking, which is incoherent.
- Blank 5: current `5:I asked my grandma to buy some seeds.` -> suggested `4:It tasted so sweet!`; confidence 0.95; The passage ends with a reflective lesson; the natural step after making a salad is to taste it, not to ask for seeds, which breaks the narrative flow.

### seven_select-sp-中考-1pb0fe2
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special. (1) I decided to make a card by myself. First, I took out a piece of red paper. (2) Then I drew some f
- Blank 4: current `4:I was very happy to see her smile.` -> suggested `5:I hid it under my bed until dinner.`; confidence 0.95; E describes a reaction after the gift is opened, which belongs later; F fits the timeline before giving the card.

### seven_select-sp-中考-1pp6ifk
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to plant some flowers in his backyard. He took out a small shovel and began to dig. (1) He carefully opened it and found an old metal box inside. (2) The
- Blank 2: current `2:He found a small key inside the box.` -> suggested `6:Tom was surprised by what he saw.`; confidence 0.9; After opening the box, the natural next step is to describe his reaction to its contents, not to find a key inside the box (the box is already open).
- Blank 3: current `6:Tom was surprised by what he saw.` -> suggested `2:He found a small key inside the box.`; confidence 0.85; After the reaction to the box's contents, the next sentence should describe what was inside; the key is not mentioned in the passage and does not fit the described contents (coins, letter, photo).
- Blank 5: current `5:Finally, Tom decided to open the box again.` -> suggested `-1:`; confidence 0.95; The box has already been opened and its contents described; opening it again after showing parents and before reburying is illogical and disrupts the sequence.

### seven_select-sp-中考-1pphh45
- Type: seven_select; exam: 中考; level: lv1
- Passage: Exams can be stressful, but there are ways to stay calm and do your best. First, get a good night’s sleep before the test. (1) Second, have a healthy breakfast. (2) When you enter 
- Blank 5: current `6:Talking to friends can also make you feel better.` -> suggested `3:This can help you feel less worried.`; confidence 0.9; The blank directly follows 'If you feel nervous, close your eyes for a moment and breathe slowly.' Option D uses 'This' to refer back to that calming action, making it coherent. Option G introduces an unrelated idea (talking to friends) not supported by the context.

### seven_select-sp-中考-1ps8vm1
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you often have trouble sleeping at night? You are not alone. Many teenagers find it hard to fall asleep or stay asleep. (1) For example, using phones or playing games before bed
- Blank 2: current `1:Here are some tips to help you sleep well.` -> suggested `5:Exercise during the day can improve your sleep.`; confidence 0.85; Blank 1 already introduces tips with 'For example', so blank 2 should be a specific tip, not a general introduction. Option F fits as a specific tip before the schedule advice.

### seven_select-sp-中考-1qbl9sv
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last month, our school held a boat race. Each class needed to form a team of eight students. (1) At first, we didn't know how to row together. Some of us rowed too fast, while othe
- Blank 3: current `2:Our boat shot across the water like an arrow.` -> suggested `1:B. We started to understand how to work together.`; confidence 0.9; The coach's instruction about rhythm logically leads to understanding teamwork, not the boat shooting across water, which belongs to race day.
- Blank 4: current `3:This experience taught us a valuable lesson.` -> suggested `2:C. Our boat shot across the water like an arrow.`; confidence 0.9; After hearing the drum and rowing as one, the boat shooting across water fits the race action; 'This experience taught us a lesson' is a concluding reflection that belongs later.
- Blank 5: current `4:Some of us wanted to give up at first.` -> suggested `3:D. This experience taught us a valuable lesson.`; confidence 0.95; The final sentence after the result and teamwork lesson naturally concludes with the lesson, not an early-stage detail about giving up.

### seven_select-sp-中考-1qejlud
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. He put on his gloves and took a small shovel. (1) He dug carefully and found a small, dirty box. (2) Tom’s heart beat f
- Blank 2: current `2:Tom was surprised and showed it to his father.` -> suggested `5:Tom had never seen such a coin before.`; confidence 0.9; Showing to father before opening the box breaks narrative sequence; suggested option fits after heart beats fast and before opening.
- Blank 4: current `6:She told him to keep digging and see what else he could find.` -> suggested `1:He put the coin in his pocket and went back to work.`; confidence 0.85; Mother telling him to keep digging is unnatural after the discovery is resolved; putting coin away and returning to work fits better.
- Blank 5: current `1:He put the coin in his pocket and went back to work.` -> suggested `6:She told him to keep digging and see what else he could find.`; confidence 0.8; Putting coin in pocket conflicts with final decision to keep it in treasure box; mother's suggestion to keep digging leads naturally to the happy ending.

### seven_select-sp-中考-1qh06tn
- Type: seven_select; exam: 中考; level: lv1
- Passage: Everyone feels sad or upset sometimes. (1) In fact, there are some easy ways to help you feel better. First, you can talk to your parents or friends. (2) When you share your feelin
- Blank 5: current `4:It is important to eat healthy food.` -> suggested `-1:`; confidence 0.95; The blank is about having enough sleep, but the current key discusses eating healthy food, which is off-topic and ungrammatical in context.

### seven_select-sp-中考-1shi55c
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom was very excited because his 12th birthday was coming. He hoped to get a new bike as a gift. (1) He thought about the cool bike in the shop window every day. On the morning of 
- Blank 2: current `0:To his surprise, there was no bike at all.` -> suggested `3:His parents had already prepared a birthday party for him.`; confidence 0.95; The passage says parents point to a big box and Tom finds a bike, so 'no bike' contradicts the story. A party preparation fits better before the gift reveal.
- Blank 4: current `5:After the story, Tom understood something important.` -> suggested `2:The story was about a little boy who loved riding.`; confidence 0.9; The father says 'let me tell you a story' before telling it, so the next sentence should introduce the story content, not its aftermath.
- Blank 5: current `3:His parents had already prepared a birthday party for him.` -> suggested `5:After the story, Tom understood something important.`; confidence 0.9; The story ends with Tom hugging his father; 'After the story, Tom understood something important' logically leads to his hug and words, while a party is irrelevant here.

### seven_select-sp-中考-1tn1h3a
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. He put on his gloves and started to pull out the weeds. (1) Suddenly, he saw something shiny under a big stone. He move
- Blank 3: current `2:Tom's mother was watering flowers in the garden.` -> suggested `1:His mother was surprised to see the box.`; confidence 0.95; After Tom runs to get his mother, the next logical step is her reaction to the box, not an unrelated watering activity.

### seven_select-sp-中考-1tnei31
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last summer, my family moved to a new house with a small garden. It was full of weeds and looked terrible. (1) We decided to turn it into a beautiful flower garden. First, we pulle
- Blank 1: current `2:It was hard work but we felt happy.` -> suggested `6:Everyone in the family helped with the work.`; confidence 0.9; The current sentence is a reflective comment that fits better after the work is described, not before starting. The suggested sentence logically introduces the collaborative effort before the steps.
- Blank 2: current `6:Everyone in the family helped with the work.` -> suggested `2:It was hard work but we felt happy.`; confidence 0.85; After pulling weeds and before digging, a comment on the effort and happiness fits naturally. The current sentence is redundant or misplaced here.
- Blank 3: current `0:Then we got some new plants from the store.` -> suggested `0:Then we got some new plants from the store.`; confidence 0.95; The current placement after planting is illogical; getting plants should precede planting. The suggested text is the same option but placed correctly in the sequence.

### seven_select-sp-中考-1uvwtcj
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, I went to the city library with my friend Tom. (1) We saw an old woman standing near the door. She looked worried because she couldn't find her reading glasses. (2) To
- Blank 1: current `3:However, we didn't know where to start.` -> suggested `6:We went to the library to return some books.`; confidence 0.95; Opening needs purpose of visit, not contrast; G fits naturally.
- Blank 2: current `0:Just then, a librarian came to help us.` -> suggested `3:However, we didn't know where to start.`; confidence 0.9; After deciding to help, uncertainty is logical; librarian arrival is abrupt.
- Blank 5: current `4:I wanted to borrow a book about science.` -> suggested `5:She said she would buy a new pair tomorrow.`; confidence 0.85; Keeps focus on old woman's plan, leading to narrator's pride; E is off-topic.

### seven_select-sp-中考-1v3zxmj
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last summer, my grandpa asked me to help him in his garden. I thought it would be boring, but I soon found it was full of surprises. (1) He showed me a small plant with big, green 
- Blank 2: current `1:A red bug was sitting on one of the leaves.` -> suggested `3:D. My grandpa taught me how to take care of the garden.`; confidence 0.9; Blank 2 follows sunflower growth and precedes daily watering/weeding; D introduces teaching garden care, which logically leads to 'Every morning, I watered...'
- Blank 3: current `3:My grandpa taught me how to take care of the garden.` -> suggested `1:B. A red bug was sitting on one of the leaves.`; confidence 0.95; Blank 3 follows 'I noticed something strange' and leads to grandpa explaining about a ladybug; B directly provides the strange thing noticed.

### seven_select-sp-中考-1v71g1d
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousin and I decided to make a special gift for her. (1) We thought a handmade card would be more meaningful than a store-bought 
- Blank 3: current `5:Her eyes lit up when she saw the card.` -> suggested `2:She hugged us and thanked us again and again.`; confidence 0.9; The sequence 'surprised' → 'hug/thanks' → 'said best gift' is more natural than placing 'eyes lit up' after 'surprised'.
- Blank 4: current `4:It was a simple card, but it was full of love.` -> suggested `5:Her eyes lit up when she saw the card.`; confidence 0.85; After putting the card on the shelf, describing her emotional reaction fits better than a reflective comment.
- Blank 5: current `2:She hugged us and thanked us again and again.` -> suggested `4:It was a simple card, but it was full of love.`; confidence 0.9; The final blank needs a reflective conclusion; 'hugged and thanked' is an action that belongs earlier.

### seven_select-sp-中考-1vq5ct1
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my birthday. I didn’t expect anything special because my parents were busy with work. (1) When I opened the door, I saw a big box on the table. (2) I was very cur
- Blank 1: current `0:When I got home, my parents were still at work.` -> suggested `2:Suddenly, the doorbell rang and a delivery man came.`; confidence 0.9; The current option is redundant and does not introduce the box; the doorbell ring naturally leads to the box appearing.
- Blank 4: current `1:I felt so happy and thanked them with a big hug.` -> suggested `4:Then I found a note saying ‘Happy Birthday’ from my parents.`; confidence 0.9; Thanking with a hug before the note is mentioned is premature; the note should come first.
- Blank 5: current `2:Suddenly, the doorbell rang and a delivery man came.` -> suggested `1:I felt so happy and thanked them with a big hug.`; confidence 0.9; The doorbell ring at the end is out of place; the story should end with the emotional reaction before painting.

### seven_select-sp-中考-1vswyvn
- Type: seven_select; exam: 中考; level: lv1
- Passage: Hamsters are popular pets for many families. They are small, cute and easy to take care of. (1) A happy hamster needs a comfortable home. First, you should prepare a cage that is b
- Blank 5: current `3:Some hamsters like to sleep during the day.` -> suggested `6:Playing with them every day is also a good idea.`; confidence 0.9; The blank is in the cleaning section; D about sleeping is irrelevant. G about playing is a better general care tip, though not perfect, but D is clearly wrong.

### seven_select-sp-中考-1wggqwc
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I didn’t have much money. (1) I decided to make a card by myself. First, I found a piece of red pa
- Blank 3: current `2:I asked my father for help.` -> suggested `3:I also wrote a short poem to show my love.`; confidence 0.95; The passage describes making a card; after decorating, writing a poem fits logically, while asking father for help is irrelevant and breaks the sequence.
- Blank 5: current `3:I was worried she might not like it.` -> suggested `4:She hugged me and thanked me warmly.`; confidence 0.9; Blank 5 is the final sentence; the current option expresses worry after she already loved the gift, which is illogical. The warm reaction fits better, but note that option E is already used in blank 4, indicating a misplacement in the key.

### seven_select-sp-中考-1x9qgwp
- Type: seven_select; exam: 中考; level: lv1
- Passage: Starting at a new school can be a big challenge. You might feel nervous because you don't know anyone. (1) For example, you can say “Hi” or ask about their hobbies. (2) If you shar
- Blank 5: current `4:Finally, you should always study hard to get good grades.` -> suggested `5:Don't be afraid to take the first step.`; confidence 0.9; The passage is entirely about making friends; 'study hard to get good grades' is off-topic, while 'take the first step' fits as a concluding remark.

### seven_select-sp-中考-1y6up9
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I woke up early and found a small box on my desk. (1) I opened it carefully and saw a blue watch inside. It was not new, but it looked clean and specia
- Blank 2: current `1:I recognized it at once.` -> suggested `4:I had no idea what it was.`; confidence 0.9; The context shows initial uncertainty before remembering the watch's history, so 'I had no idea' fits better than immediate recognition.
- Blank 5: current `4:I had no idea what it was.` -> suggested `1:I recognized it at once.`; confidence 0.85; After learning the watch's significance, 'I recognized it at once' provides a natural concluding reflection, while 'I had no idea' contradicts the established knowledge.

### seven_select-sp-中考-1yqx5ig
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my 15th birthday. I thought I would get a new phone or a cool bike. (1) When I opened the box, I saw an old photo album. It was full of pictures of my parents and
- Blank 5: current `3:Then I got a new phone from my uncle.` -> suggested `4:E. This album is more valuable to me than any phone.`; confidence 0.95; The passage ends with a reflection on love; D introduces an unrelated phone gift, breaking coherence. E fits the theme and conclusion.

### seven_select-sp-中考-2uvbd5
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. (1) He started to pull out the weeds carefully. Suddenly, he found something hard under the soil. (2) It was a small, r
- Blank 2: current `2:His mother was surprised and happy.` -> suggested `1:He dug it out with his hands.`; confidence 0.95; After finding a hard object, digging it out is the immediate next action; mother's reaction is premature.
- Blank 3: current `3:It was written in 1920.` -> suggested `2:His mother was surprised and happy.`; confidence 0.9; After opening the box and seeing contents, mother's reaction fits better than stating the letter's date.
- Blank 4: current `4:They decided to dig more and finally found a bag of silver coins.` -> suggested `3:It was written in 1920.`; confidence 0.9; The letter is introduced in blank 3, so its date naturally follows before the treasure story.
- Blank 5: current `5:He remembered he had homework to do.` -> suggested `4:They decided to dig more and finally found a bag of silver coins.`; confidence 0.95; After Tom tells his mother, digging together and finding coins is logical; homework is irrelevant.

### seven_select-sp-中考-2z8b0v
- Type: seven_select; exam: 中考; level: lv1
- Passage: Summer is a great time for fun and outdoor activities. (1) Here are some simple tips to help you stay healthy during the hot days. First, drink plenty of water. (2) If you feel thi
- Blank 2: current `3:When you go out, always remember to use sunscreen.` -> suggested `0:Your body loses water quickly when you sweat.`; confidence 0.95; The context about drinking water and thirst requires an explanation of water loss, not sunscreen advice.

### seven_select-sp-中考-3333oq
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I took out a piece of red paper and some c
- Blank 5: current `6:I felt a little sad because I couldn’t buy a gift.` -> suggested `-1:`; confidence 0.95; The passage ends with a positive lesson about love; the sad sentence contradicts the flow and conclusion.

### seven_select-sp-中考-3gg88c
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special. (1) I decided to make a card by myself. I got some paper, colored pencils and glue. (2) I drew a big h
- Blank 3: current `4:Then I wrote some beautiful words on the back.` -> suggested `2:I spent the whole afternoon on it.`; confidence 0.9; After drawing and sticking flowers, writing on the back is out of logical order; 'I spent the whole afternoon on it' fits better as a summary before putting it in the envelope.

### seven_select-sp-中考-3idw56
- Type: seven_select; exam: 中考; level: lv1
- Passage: Some students think that studying for hours without a break is the best way to learn. However, this is not always true. (1) In fact, taking short breaks can help your brain remembe
- Blank 4: current `1:Studying all night before a test is a common habit.` -> suggested `2:It is also important to choose a quiet place to study.`; confidence 0.9; The passage discusses the Pomodoro Technique and its benefits; inserting a sentence about all-night studying is irrelevant and breaks the flow. Option C about a quiet place fits as a natural additional tip.

### seven_select-sp-中考-45s7jy
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. (1) He started to pull out the weeds carefully. Suddenly, he found something hard under the soil. (2) Tom was curious a
- Blank 5: current `3:He ran to tell his father about the box.` -> suggested `6:Tom felt a little disappointed at first.`; confidence 0.85; The passage ends with a positive shared moment; 'ran to tell his father' is an abrupt, unmentioned action that breaks the flow. Option G, though not perfect, fits better as a contrast before the discovery, but the current key is clearly wrong for this position.

### seven_select-sp-中考-6ei8w8
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I took out some colored paper, scissors an
- Blank 1: current `1:I felt very sad and didn’t know what to do.` -> suggested `0:Then I began to work on the card carefully.`; confidence 0.95; The current key expresses sadness and confusion, but the passage already states a decision to make a card, so the logical next step is to begin working on it.
- Blank 2: current `0:Then I began to work on the card carefully.` -> suggested `6:I also added some green leaves to make it look more beautiful.`; confidence 0.9; After taking out materials, the next step is to start working on the card; the current key belongs to blank 1, and adding leaves is a later detail.
- Blank 3: current `6:I also added some green leaves to make it look more beautiful.` -> suggested `0:Then I began to work on the card carefully.`; confidence 0.85; Blank 3 occurs after drawing and writing, so adding leaves is plausible but the suggested text is out of place; the current key is not the best fit for this position.

### seven_select-sp-中考-6li36c
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her a special gift. (1) I decided to make a card by myself. I got some paper and colored pencils. (2) I drew a big heart and 
- Blank 5: current `0:I bought a new dress for her.` -> suggested `-1:`; confidence 0.95; The passage consistently describes making a card; buying a dress contradicts the narrative and does not fit after the mother's positive reaction.

### seven_select-sp-中考-7iu18g
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I didn’t have much money. (1) I decided to make a card by myself. I got some colored paper, glue a
- Blank 1: current `0:I wanted to buy a new dress for her.` -> suggested `4:I ran to the store to buy some flowers.`; confidence 0.9; Option A contradicts 'didn't have much money' and the decision to make a card; it is clearly wrong.

### seven_select-sp-中考-7pp7rl
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Mother’s Day, and Lily wanted to do something special for her mom. She got up early and went to the kitchen quietly. (1) She found some bread, eggs and milk in the fridge. (
- Blank 3: current `3:She also wrote a card and put it on the tray.` -> suggested `2:Next, she toasted two slices of bread.`; confidence 0.9; The sequence of cooking requires toasting bread after butter and egg, before plating; the card belongs later.
- Blank 4: current `6:She quietly opened the door and went in.` -> suggested `3:She also wrote a card and put it on the tray.`; confidence 0.85; Adding a card after plating is natural before carrying the tray; opening the door fits better at blank 5.
- Blank 5: current `4:Her mom was surprised and happy.` -> suggested `6:She quietly opened the door and went in.`; confidence 0.9; Lily must enter the room before mom reacts; 'surprised and happy' is a reaction after seeing breakfast.

### seven_select-sp-中考-7ytrvz
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was a dark and rainy afternoon. Tom was walking home from school when he saw an old woman standing by the road. She looked wet and cold. (1) He went up to her and asked if she n
- Blank 2: current `1:The woman thanked Tom and his mother again and again.` -> suggested `6:The old woman lived alone in a small house.`; confidence 0.9; Thanking occurs after help is completed, not before Tom decides to help.
- Blank 3: current `5:Tom had a math test the next day.` -> suggested `1:The woman thanked Tom and his mother again and again.`; confidence 0.85; After buying a hot drink, thanking is natural; math test is irrelevant.
- Blank 4: current `3:Tom knew he should not talk to strangers.` -> suggested `0:Tom felt very tired after a long day at school.`; confidence 0.9; After driving her home, a reflective sentence fits; 'not talk to strangers' contradicts the positive message.

### seven_select-sp-中考-830gqq
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my father and I decided to plant some flowers in our backyard. (1) We bought some seeds and tools from the shop nearby. When we started digging, my shovel hit somethin
- Blank 4: current `1:Then we went back home to watch TV.` -> suggested `3:D. After that, we cleaned the box and put it on the shelf.`; confidence 0.95; The narrative flow after finding and reading the note logically leads to cleaning and storing the box, not going home to watch TV, which disrupts the gardening context.

### seven_select-sp-中考-8d0b05
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom’s family moved to a new house last month. The house was nice, but the garden was a mess. (1) He decided to turn it into a vegetable garden. (2) He asked his mother to help him 
- Blank 3: current `2:Tom’s mother was also happy and praised him.` -> suggested `1:Tom and his mother planted the seeds in the soil.`; confidence 0.95; After buying seeds, planting is the logical next step; praise is premature.
- Blank 4: current `3:The garden was too small for a vegetable garden.` -> suggested `2:Tom’s mother was also happy and praised him.`; confidence 0.9; Seeing sprouts naturally leads to praise, not a contradictory statement about garden size.
- Blank 5: current `4:Tom wanted to grow flowers instead of vegetables.` -> suggested `-1:`; confidence 0.85; Wanting flowers contradicts the successful vegetable garden ending; no suitable option.

### seven_select-sp-中考-8i1g8g
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my birthday. I didn’t expect any big celebration because my parents were busy at work. (1) When I opened the door, I saw a big box on the table. (2) I carefully o
- Blank 4: current `3:All my friends came to play with me that afternoon.` -> suggested `5:I felt very tired after the long day.`; confidence 0.85; After playing in the garden, feeling tired is a natural sequence; friends are not introduced earlier.

### seven_select-sp-中考-8ko5zz
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousins and I decided to give her a special gift. (1) We wanted to show her how much we loved her. First, we made a big card with
- Blank 5: current `4:We also wrote a poem for her on the back.` -> suggested `1:We all felt very happy and proud.`; confidence 0.85; The passage ends with grandmother's reaction; adding another gift detail after 'the best birthday' is awkward and illogical. A concluding emotional response fits naturally.

### seven_select-sp-中考-9omdbd
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, Tom helped his grandfather work in the garden. (1) He thought it would be just watering and weeding. But his grandfather gave him a small shovel and asked him to dig a
- Blank 1: current `3:Tom had never done any digging before.` -> suggested `2:Tom felt a little disappointed at first.`; confidence 0.85; The passage states Tom thought it would be just watering and weeding, so disappointment at the unexpected task fits better than a statement about never digging before.
- Blank 5: current `1:“What are we going to do?” Tom asked.` -> suggested `6:Tom’s grandpa laughed and said, “It’s our family secret.”`; confidence 0.9; After Tom decides to rebury the treasure, a remark from grandpa about the family secret provides natural closure; Tom's question 'What are we going to do?' is irrelevant at this point.

### seven_select-sp-中考-b99lkp
- Type: seven_select; exam: 中考; level: lv1
- Passage: One afternoon, Tom was on his way home from school. He got on a bus and found a seat near the window. (1) He noticed an old woman standing with a heavy bag. (2) Tom stood up and of
- Blank 1: current `1:The bus was very crowded and there were no empty seats.` -> suggested `0:Tom was reading a book when the bus moved.`; confidence 0.9; The passage states Tom found a seat, so 'no empty seats' contradicts that. Option A provides a plausible initial activity.
- Blank 5: current `0:Tom was reading a book when the bus moved.` -> suggested `5:He felt proud of what he had done.`; confidence 0.95; The final blank should reflect Tom's reflection on kindness; 'reading a book' is irrelevant and breaks the flow.

### seven_select-sp-中考-b9cunn
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother's 70th birthday. My cousins and I wanted to give her a special gift. (1) We thought a big party would be nice, but Grandma always said she preferred 
- Blank 4: current `0:We decided to buy her a new dress.` -> suggested `2:C. She was very happy to see all of us.`; confidence 0.9; The story builds toward finding the book as the gift; buying a dress contradicts that. 'She was very happy to see all of us' fits the party context and leads naturally to opening the box.

### seven_select-sp-中考-cgm5hj
- Type: seven_select; exam: 中考; level: lv1
- Passage: In the past, students usually sat in classrooms and listened to their teachers. But now, things are changing. (1) This new way of learning is called "online learning". With the hel
- Blank 4: current `5:Teachers can give students more homework to do at home.` -> suggested `2:It is important to find a balance between online and offline activities.`; confidence 0.9; The passage discusses problems of online learning and then calls for help from teachers and parents; option C about balance logically follows the problems and leads to the concluding sentence, while option F about giving more homework is irrelevant and contradicts the supportive tone.

### seven_select-sp-中考-cjnc2l
- Type: seven_select; exam: 中考; level: lv1
- Passage: The Internet is a great place to learn and have fun. But it can also be dangerous if you are not careful. (1) First, never share your personal information like your full name, addr
- Blank 2: current `2:It is important to be careful when you are online.` -> suggested `1:Always use a strong password for your accounts.`; confidence 0.9; The passage uses sequential markers (First, Second, Third, Finally). Blank 2 follows 'First' and needs a concrete second tip, not a general statement.
- Blank 3: current `5:Third, be careful about what you post on social media.` -> suggested `4:Never agree to meet someone you only know online without a parent.`; confidence 0.8; The sequence requires a 'Third' tip. Option E fits logically as the third tip after 'Second' and before 'Finally'.
- Blank 4: current `4:Never agree to meet someone you only know online without a parent.` -> suggested `5:Third, be careful about what you post on social media.`; confidence 0.8; Blank 4 is between 'Third' (implied) and 'Finally'. Option F with 'Third' fits naturally as the third tip, maintaining the sequence.

### seven_select-sp-中考-e2ei9n
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to visit his grandmother in the countryside. He hadn't seen her for months. (1) He took a bus and then walked for twenty minutes. When he arrived, the ho
- Blank 5: current `5:Tom felt sorry for being late.` -> suggested `6:She had a small garden behind the house.`; confidence 0.9; No mention of lateness; garden context is needed for blank 3 and fits better here.

### seven_select-sp-中考-efwe22
- Type: seven_select; exam: 中考; level: lv1
- Passage: When you meet someone for the first time, you want to make a good impression. (1) Here are some simple tips that can help you. First, smile warmly. A smile shows that you are frien
- Blank 2: current `3:A first impression is often the most important one.` -> suggested `0:It makes others feel comfortable around you.`; confidence 0.9; The blank follows 'smile warmly' and needs a sentence explaining the effect of smiling; option A directly connects, while D is a general statement that fits better at the beginning.

### seven_select-sp-中考-eiw4vx
- Type: seven_select; exam: 中考; level: lv1
- Passage: Everyone wants to have good friends. But do you know how to be a good friend? (1) First, always be honest with your friends. If you make a mistake, say sorry. (2) Second, listen to
- Blank 5: current `5:Finally, never talk to your friends when they are upset.` -> suggested `-1:`; confidence 0.95; The current key gives negative advice, contradicting the passage's positive tone; no suitable replacement in the bank.

### seven_select-sp-中考-ey0y6d
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you often feel tired when studying for a long time? Many students have the same problem. (1) In fact, taking short breaks can help you learn better. (2) For example, after 25 mi
- Blank 3: current `6:These activities help your body and mind relax.` -> suggested `2:Your body also needs to move to stay healthy.`; confidence 0.9; G's 'these activities' has no antecedent; C logically introduces the need for movement before the stretch suggestion.
- Blank 4: current `2:Your body also needs to move to stay healthy.` -> suggested `6:These activities help your body and mind relax.`; confidence 0.9; After mentioning stretches, G naturally summarizes their benefit; C is too general and disrupts the flow.

### seven_select-sp-中考-f2pb5f
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I didn't expect anything special because my parents were busy with work. (1) When I came back home, the house was dark and quiet. I felt a little sad. 
- Blank 2: current `2:They said they were too tired to celebrate.` -> suggested `1:I went to my room and did my homework.`; confidence 0.95; The current key contradicts the surprise; the suggested option fits the sad mood before the surprise.

### seven_select-sp-中考-g8vcbj
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, I stayed at home alone because my parents went to visit my grandparents. I was doing my homework when I heard a strange noise from the kitchen. (1) I walked quietly 
- Blank 4: current `6:Seeing the bird safe, I felt really happy.` -> suggested `3:After that, I went back to my homework.`; confidence 0.9; The bird is taken away at blank 4, so 'Seeing the bird safe' is premature; 'After that, I went back to my homework' logically follows the rescue.
- Blank 5: current `3:After that, I went back to my homework.` -> suggested `6:Seeing the bird safe, I felt really happy.`; confidence 0.9; Blank 5 is the final sentence; 'Seeing the bird safe, I felt really happy' provides a natural emotional conclusion, while 'After that, I went back to my homework' is anticlimactic.

### seven_select-sp-中考-ggktco
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I found some paper, colored pencils and gl
- Blank 3: current `3:She said it was the best gift she had ever received.` -> suggested `4:After finishing, I put the card in an envelope.`; confidence 0.9; The sequence requires finishing the card before giving it; the mother's reaction should come after she receives it.
- Blank 4: current `4:After finishing, I put the card in an envelope.` -> suggested `3:She said it was the best gift she had ever received.`; confidence 0.9; The mother's reaction naturally follows seeing the card; the envelope step should precede giving.

### seven_select-sp-中考-gkh8ae
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I didn’t have much money. (1) I decided to make a card by myself. I got some colored paper, scisso
- Blank 5: current `0:I bought a beautiful dress for her.` -> suggested `2:She put the card on the table and said nothing.`; confidence 0.9; Buying a dress contradicts the narrative of having little money and making a card; option C provides a plausible contrast before the final positive reflection.

### seven_select-sp-中考-hdf72n
- Type: seven_select; exam: 中考; level: lv1
- Passage: Starting at a new school can be a little scary. You may feel nervous because you don’t know anyone. (1) First, try to smile and say hello to your classmates. (2) You can ask them a
- Blank 5: current `5:This will make others feel welcome and warm.` -> suggested `6:They might be just as nervous as you are.`; confidence 0.9; The current key F introduces a new idea about making others feel welcome, but the preceding sentence 'Remember, everyone feels the same way sometimes' is directly explained by G, which states that others might be just as nervous.

### seven_select-sp-中考-k287eb
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousins and I decided to give her a surprise. (1) We wanted to make her feel loved and happy. (2) I made a card with a picture of
- Blank 1: current `0:We planned to make a photo album for her.` -> suggested `5:But we didn't know what to give her at first.`; confidence 0.9; The passage starts with deciding to give a surprise, then expresses the desire to make her feel loved. Inserting the plan directly skips the natural step of initial uncertainty, which F provides as a logical transition.
- Blank 2: current `2:Then my sister helped me put the photos into a nice album.` -> suggested `0:We planned to make a photo album for her.`; confidence 0.85; After expressing the desire to make her feel loved, the next logical step is to state the plan. The current sentence assumes photos already exist, which is not introduced yet.
- Blank 3: current `4:Tom also brought a box of chocolates for her.` -> suggested `2:Then my sister helped me put the photos into a nice album.`; confidence 0.9; After stating the plan to make a photo album, the next step should be executing that plan. Introducing chocolates breaks the logical sequence.
- Blank 4: current `1:She hugged us one by one and thanked us.` -> suggested `4:Tom also brought a box of chocolates for her.`; confidence 0.8; After Grandma sees the album and is moved, the natural next action is to present additional gifts (chocolates) before the hugging and thanking.
- Blank 5: current `6:After that, we all sang a birthday song together.` -> suggested `1:She hugged us one by one and thanked us.`; confidence 0.85; After receiving chocolates, Grandma would naturally hug and thank them before they sing a song. The current order has singing before hugging, which is less coherent.

### seven_select-sp-中考-l94ko8
- Type: seven_select; exam: 中考; level: lv1
- Passage: In today’s fast-paced world, many students find it hard to balance schoolwork and fun. (1) However, with a little planning, you can enjoy both. First, make a weekly schedule. (2) F
- Blank 5: current `5:Some students prefer to study late at night.` -> suggested `0:A. Many students feel too tired to do anything after school.`; confidence 0.85; Blank 5 follows 'talk to your parents or friends when you feel stressed'; option F about studying late is irrelevant, while A provides a plausible reason for stress, fitting the context better.

### seven_select-sp-中考-lev21n
- Type: seven_select; exam: 中考; level: lv1
- Passage: Many people think that happiness comes from having a lot of money or expensive things. However, studies show that true happiness is often found in simple things. (1) For example, s
- Blank 1: current `0:Money can buy a big house, but it cannot buy a happy family.` -> suggested `2:These moments make us feel connected and valued.`; confidence 0.9; Option A introduces an unrelated contrast about money, while Option C directly refers to 'these moments' and logically follows the preceding sentence about spending time with family and friends.

### seven_select-sp-中考-lkh0tp
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom helped his mother plant some flowers in the garden. (1) He was surprised to find a small, dirty box under the soil. (2) Tom opened it carefully. Inside the box, 
- Blank 2: current `5:He picked up the box and cleaned it with a cloth.` -> suggested `1:He decided to throw the box away.`; confidence 0.8; The current option 'cleaned it' is unsupported; the next sentence says 'Tom opened it carefully', so no cleaning action fits. The suggested option is also illogical, but the blank requires a filler that does not contradict the immediate sequence. Since no option perfectly bridges, the current one is clearly wrong.

### seven_select-sp-中考-mu8yfm
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my mother and I decided to plant some flowers in our garden. (1) We bought some seeds from a shop and started digging in the soil. (2) Suddenly, I saw something shiny 
- Blank 2: current `3:We found a small box under a big tree.` -> suggested `2:C. I was so excited that I jumped up and down.`; confidence 0.9; The passage describes seeing something shiny, then immediately says 'It was an old coin'. Inserting 'found a small box' breaks the logical flow and is never referenced again.

### seven_select-sp-中考-n2mxo0
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom was a quiet boy who loved reading books. He often sat alone in the school library during lunch break. (1) One day, a new student named Jack came to his school. Jack was very ou
- Blank 4: current `6:Jack invited Tom to play basketball after school.` -> suggested `3:From then on, they did many things together.`; confidence 0.9; Current option G introduces basketball invitation, but next sentence already says they played basketball, causing redundancy. Option D better transitions to the examples.
- Blank 5: current `3:From then on, they did many things together.` -> suggested `5:This experience changed Tom's life.`; confidence 0.85; Current option D summarizes activities already described, but passage ends with a general lesson. Option F provides a natural personal reflection leading into the concluding sentence.

### seven_select-sp-中考-n9u5u8
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last month, our school held a robot-building competition. My friend Tom and I decided to join it. (1) We had to build a robot that could move a ball into a goal. At first, we worke
- Blank 3: current `1:We felt very proud and excited.` -> suggested `5:F. It was not easy at all.`; confidence 0.9; After describing the effort to get the robot working, 'It was not easy at all' summarizes the difficulty, while 'We felt very proud and excited' is premature before the competition.
- Blank 5: current `4:The first prize went to another team.` -> suggested `6:G. We won the second place.`; confidence 0.95; The passage ends with planning for next year, implying a positive outcome; 'The first prize went to another team' is irrelevant and breaks the flow, while 'We won the second place' provides a logical result.

### seven_select-sp-中考-nocq94
- Type: seven_select; exam: 中考; level: lv1
- Passage: When you meet someone for the first time, you want to make a good impression. (1) It can help you make new friends or get a good job. First, you should dress neatly. (2) It shows t
- Blank 3: current `3:Looking at someone shows you are honest.` -> suggested `4:Nodding your head sometimes is also helpful.`; confidence 0.9; The blank follows 'smile and look the person in the eye'; 'looking at someone' repeats the prior instruction, while nodding adds a new, logical next step.

### seven_select-sp-中考-nq4u58
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my mother and I decided to plant some flowers in our backyard. (1) We bought some seeds from the market and prepared the soil. While digging, I suddenly hit something 
- Blank 5: current `5:It looked like a treasure chest from a story.` -> suggested `2:To our joy, the coins were still valuable.`; confidence 0.9; The passage ends with the garden becoming more special, which naturally follows learning the coins are valuable; the current key describes the box as a treasure chest, which is out of place at the end.

### seven_select-sp-中考-o37s3g
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was a cold winter morning. Lily and her brother Tom wanted to do something special for their mother. (1) They decided to make breakfast for her. Lily got some bread and eggs fro
- Blank 4: current `2:Mom was still sleeping when they came in.` -> suggested `0:Tom broke a cup and felt sorry.`; confidence 0.95; Mom sleeping contradicts her being surprised and happy when they enter; a minor accident fits better before the hug.

### seven_select-sp-中考-p0k2jc
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my friend Tom and I went to the park to fly kites. The weather was sunny and warm, perfect for outdoor activities. (1) We sat on the grass and watched the colorful kit
- Blank 3: current `4:I remembered that we had helped him a week ago.` -> suggested `0:Tom and I were both surprised by the gift.`; confidence 0.9; The boy's speech reveals the reason for the gift, and the next sentence says 'We had almost forgotten about that,' so a memory statement contradicts the flow; surprise is the natural reaction.
- Blank 5: current `3:After that, we felt very happy.` -> suggested `6:We enjoyed the rest of the afternoon.`; confidence 0.85; Blank 5 is the final sentence before the concluding line; 'We enjoyed the rest of the afternoon' provides a natural closing activity, while 'After that, we felt very happy' is vague and redundant.

### seven_select-sp-中考-p1pwct
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. He put on his gloves and began to pull out weeds. (1) Suddenly, he noticed something shiny under a big stone. (2) He ca
- Blank 1: current `1:He found a small wooden box under the stone.` -> suggested `4:He picked up the stone and saw a box.`; confidence 0.9; Noticing something shiny under a stone logically leads to moving the stone to see it, not already finding a box without moving the stone.
- Blank 3: current `4:He picked up the stone and saw a box.` -> suggested `1:He found a small wooden box under the stone.`; confidence 0.85; After mother comes and looks surprised, the next action should be opening the box, not repeating the discovery which should have occurred earlier.
- Blank 5: current `0:The stone was too heavy for him to move.` -> suggested `2:His mother was busy cooking in the kitchen.`; confidence 0.95; The stone has already been moved, so saying it was too heavy contradicts the story; the suggested option, though not ideal, is less contradictory and fits the narrative flow better.

### seven_select-sp-中考-pmmlql
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you sometimes feel that you study hard but still cannot remember things well? You are not alone. Many students have the same problem. (1) Scientists have found that the way we s
- Blank 4: current `4:Sleep is very important for our health.` -> suggested `6:G. Your brain works better when you are relaxed.`; confidence 0.9; The context directly links sleep to brain processing of learned material; G maintains the focus on memory and learning, while E is a generic health statement that disrupts the flow.

### seven_select-sp-中考-potfhi
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my birthday. I woke up early and felt very excited. (1) I walked into the living room and saw a big box on the table. (2) My parents smiled and said, “Open it!” I
- Blank 3: current `5:I was so surprised that I couldn’t say a word.` -> suggested `2:It was a book about animals.`; confidence 0.95; The box contains a bicycle, so describing it as a book is factually incorrect; the surprise reaction should follow seeing the bicycle.
- Blank 5: current `2:It was a book about animals.` -> suggested `5:I was so surprised that I couldn’t say a word.`; confidence 0.95; After opening the box and seeing the bicycle, the natural reaction is surprise; the book sentence is irrelevant and breaks coherence.

### seven_select-sp-中考-q5l6zn
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I got some paper, colored pencils, and glu
- Blank 1: current `1:I worked on it carefully for two hours.` -> suggested `5:At first I felt a little sad.`; confidence 0.9; The context 'I had no money' naturally leads to initial sadness before deciding to make a card; 'worked on it carefully' is out of place here.
- Blank 3: current `5:At first I felt a little sad.` -> suggested `1:I worked on it carefully for two hours.`; confidence 0.9; After describing the drawing and decorating, the next logical step is completing the work, not a sudden return to sadness.

### seven_select-sp-中考-qpcbxh
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last spring, my family moved to a new house with a small yard. The yard was empty except for some old stones. (1) My father decided to turn it into a garden. At first, I thought it
- Blank 2: current `3:However, I changed my mind after a few weeks.` -> suggested `1:I didn't believe anything could grow there.`; confidence 0.9; After 'At first, I thought it was a boring idea', expressing disbelief (B) is logical before describing the work. Option D ('However, I changed my mind') is premature as no growth has occurred yet.

### seven_select-sp-中考-rl0k31
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my mother asked me to help her in the garden. She wanted to plant some flowers. (1) I was not very happy because I thought it would be boring. When we got there, I saw
- Blank 5: current `1:However, I still went with her because she needed my help.` -> suggested `2:It was a big surprise for me!`; confidence 0.9; Blank 5 is the final sentence; B is a transition that belongs earlier, while C provides a natural concluding reaction to the gift.

### seven_select-sp-中考-s7c393
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousin and I wanted to give her a special gift. (1) We decided to make a photo album for her. First, we collected all the old fam
- Blank 4: current `2:We had never made a photo album before.` -> suggested `4:After that, we chose the best ones for the album.`; confidence 0.9; The current key 'We had never made a photo album before' is irrelevant after writing stories and before giving the gift; the suggested 'After that, we chose the best ones' fits the narrative sequence better.

### seven_select-sp-中考-t6so92
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I didn’t expect anything special because my parents were very busy. (1) When I walked into the living room, I saw a big box on the table. (2) I opened 
- Blank 5: current `4:My father bought it for me last month.` -> suggested `-1:`; confidence 0.95; The key says the father bought it last month, but the context says parents saved money and gave it as a birthday gift, creating a contradiction.

### seven_select-sp-中考-tlsupb
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was Mother’s Day. Tom and his sister Lily wanted to give their mom a special surprise. (1) They decided to make breakfast for her. Tom got the bread and milk from the f
- Blank 5: current `1:After breakfast, they went to the park.` -> suggested `4:Finally, they finished and felt proud.`; confidence 0.95; The passage ends with cleaning the kitchen and reflecting on the morning, not going to the park. Option E logically follows the gift-giving and cleanup.

### seven_select-sp-中考-wxlcp9
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I didn’t expect any big celebration because my parents were busy with work. (1) When I came back from school, the house was dark and quiet. I felt a li
- Blank 1: current `0:I turned on the light slowly.` -> suggested `4:However, something special was waiting for me.`; confidence 0.9; The contrast with the previous sentence and the setup for the surprise is needed; turning on the light is a trivial action that breaks the logical flow.
- Blank 2: current `4:However, something special was waiting for me.` -> suggested `0:I turned on the light slowly.`; confidence 0.9; After entering a dark room, turning on the light is the natural next action; the current option is redundant and disrupts the sequence.
- Blank 5: current `1:Suddenly I heard a strange noise from my room.` -> suggested `6:After the party, I helped clean the house.`; confidence 0.95; The party has concluded; a strange noise is incoherent here, while cleaning up logically leads to the final reflective sentence.

### seven_select-sp-中考-x3otpm
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I didn't expect any gifts because my family was busy preparing for a trip. (1) When I came back from school, I found a small box on my desk. It was wra
- Blank 1: current `2:I was a little disappointed at first.` -> suggested `1:However, my mother remembered my wish.`; confidence 0.9; Disappointment contradicts 'didn't expect any gifts'; mother remembering fits the surprise.
- Blank 2: current `0:I decided to buy a pen for myself.` -> suggested `4:I ran to my mother and asked who gave it to me.`; confidence 0.95; After finding a gift, asking who gave it is natural; deciding to buy one is illogical.
- Blank 3: current `1:However, my mother remembered my wish.` -> suggested `5:I knew it was from my mother because she always listens carefully.`; confidence 0.85; Mother's explanation follows the question; 'I knew it was from my mother' fits the discovery context.
- Blank 4: current `4:I ran to my mother and asked who gave it to me.` -> suggested `1:However, my mother remembered my wish.`; confidence 0.9; Mother's line is a response to the child's question, so the question must come first.
- Blank 5: current `5:I knew it was from my mother because she always listens carefully.` -> suggested `0:I decided to buy a pen for myself.`; confidence 0.95; Final sentence about keeping the pen; buying a pen is irrelevant and breaks flow.

### seven_select-sp-中考-x80hez
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, Mom asked me to help her in the garden. (1) I thought it would be boring, but I said yes anyway. When we got outside, Mom handed me a small shovel and pointed to a cor
- Blank 1: current `1:Mom said, 'Dig here, and you will find something interesting.'` -> suggested `3:I didn't want to go because I was tired.`; confidence 0.9; The sentence 'I thought it would be boring, but I said yes anyway' logically follows a reluctance to go, not a direct instruction to dig.
- Blank 2: current `2:We worked in the garden every weekend.` -> suggested `1:Mom said, 'Dig here, and you will find something interesting.'`; confidence 0.95; After being handed a shovel and pointed to a corner, the natural next step is an instruction to dig, not a general statement about weekend work.
- Blank 3: current `4:Then Mom told me to open it.` -> suggested `0:I was surprised and asked why she did that.`; confidence 0.85; After hitting something hard and finding a metal box, the immediate reaction is surprise and a question, not an instruction to open it (which would come later).
- Blank 4: current `0:I was surprised and asked why she did that.` -> suggested `4:Then Mom told me to open it.`; confidence 0.8; After seeing the photo inside the box, Mom's explanation about hiding it as a surprise logically follows; the question 'why she did that' is already answered by Mom's next line.
- Blank 5: current `5:Grandma came to visit us last month.` -> suggested `6:I carefully put the box back and went inside.`; confidence 0.9; The passage ends with 'I will never forget that special morning' — putting the box back and going inside provides a natural conclusion, while a past visit from Grandma is irrelevant.

### seven_select-sp-中考-xe0dqy
- Type: seven_select; exam: 中考; level: lv1
- Passage: Making a good first impression is important in many situations, such as meeting new friends or going for a job interview. (1) Here are some simple tips that can help you. First, al
- Blank 1: current `6:Making a good first impression is not difficult at all.` -> suggested `1:Don't forget to shake hands firmly when you say hello.`; confidence 0.9; G is a concluding statement, but the passage introduces tips after the blank; B fits as a specific tip.

### seven_select-sp-中考-xnm5qu
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousin and I wanted to give her something special. (1) We decided to make a photo album by ourselves. First, we collected photos 
- Blank 3: current `0:We bought a big cake from the shop.` -> suggested `2:There were many old photos in the box.`; confidence 0.95; The context describes putting the album in a box and Grandma opening it to see photos; 'We bought a big cake' is irrelevant and breaks coherence.
- Blank 5: current `4:We also invited all her friends to the party.` -> suggested `-1:`; confidence 0.9; The passage ends with the gift bringing joy; inviting friends is unrelated and not mentioned elsewhere. No better option fits, but the current key is clearly out of place.

### seven_select-sp-中考-yfphqe
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my 15th birthday. I didn’t expect any big celebration because my parents were busy at work. (1) When I got home, I found a note on the table. It said, “Your gift 
- Blank 2: current `1:I felt very surprised.` -> suggested `5:I quickly ran to the garden.`; confidence 0.9; After reading the note, the natural next action is to go to the garden, not to repeat surprise.

### seven_select-sp-中考-ys74q3
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, my parents were busy in the kitchen, so I decided to do something special for them. I went to the backyard and started planting some flower seeds in the empty flower
- Blank 2: current `6:At first, I didn't know what to plant, but finally I chose sunflowers.` -> suggested `5:I planted the seeds in a straight line and marked the spots with small sticks.`; confidence 0.9; Blank 2 follows covering seeds and watering; a flashback to choosing seeds is out of sequence. The suggested option describes the planting process before watering, fitting the timeline.
- Blank 4: current `0:I thought they would be angry because I didn't ask for permission.` -> suggested `4:They told me that they had watched me from the window every afternoon.`; confidence 0.85; After 'they had already noticed', explaining how they noticed is the natural follow-up, not the child's worry about anger.
- Blank 5: current `3:However, I was a little worried that they might not like the flowers.` -> suggested `0:I thought they would be angry because I didn't ask for permission.`; confidence 0.8; After mother's proud statement, the child's worry about anger provides a contrast. The current key 'worried they might not like the flowers' is less logical after a positive reaction.

### seven_select-sp-中考-z1a8zl
- Type: seven_select; exam: 中考; level: lv1
- Passage: The Internet is a great place to learn and have fun. But it can also be dangerous if you are not careful. (1) First, never share your personal information like your full name, addr
- Blank 2: current `6:Your parents can help you decide if it’s safe.` -> suggested `3:Don’t click on links from people you don’t know.`; confidence 0.9; The passage lists numbered safety tips; blank 2 follows 'Second, don’t meet someone...' and should be another specific tip, not a general statement about parents.
- Blank 3: current `3:Don’t click on links from people you don’t know.` -> suggested `6:Your parents can help you decide if it’s safe.`; confidence 0.85; Blank 3 follows 'If someone online makes you feel uncomfortable, tell a trusted adult immediately.' The natural continuation is about parents helping decide safety, not an unrelated tip about links.

### seven_select-sp-中考-z7sf2v
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you often have trouble sleeping at night? You are not alone. Many teenagers find it hard to fall asleep. (1) But the good news is that there are simple ways to improve your slee
- Blank 5: current `6:Many students stay up late to finish their homework.` -> suggested `2:Having a heavy meal may cause discomfort and keep you awake.`; confidence 0.95; The blank follows 'don’t eat too much before bedtime' and needs a reason or consequence. Option C directly explains why a heavy meal is bad, while G is irrelevant to eating.

### seven_select-sp-中考-zf7gw3
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. (1) He wanted to plant some flowers for her birthday. (2) Tom worked hard for an hour. He dug holes, put in the seeds, 
- Blank 2: current `0:Tom found some old toys in the garden, but he didn't stop.` -> suggested `5:Tom worked hard for an hour.`; confidence 0.95; The current option about old toys is irrelevant and breaks the logical sequence; the suggested option directly follows the planting intention and leads naturally into the details.
- Blank 5: current `4:Then Tom remembered he forgot to put away his toys.` -> suggested `-1:`; confidence 0.9; The toy recollection is irrelevant and does not connect to the mother's comforting words or the shared plan; no better option exists, but the current choice is clearly unacceptable.

### seven_select-sp-中考-zil3q1
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my 15th birthday. I didn't expect a big party because my family was busy. (1) In the morning, I helped my mom clean the house and then did my homework. (2) When I
- Blank 2: current `2:I thanked him and gave him a hug.` -> suggested `0:Suddenly, the doorbell rang.`; confidence 0.95; The doorbell ringing triggers the surprise; thanking comes after receiving the gift, not before.
- Blank 3: current `5:I put on the watch and showed it to everyone.` -> suggested `2:I thanked him and gave him a hug.`; confidence 0.9; After receiving the watch, the natural response is to thank; showing it comes later.
- Blank 4: current `3:I went to the kitchen to get some water.` -> suggested `5:I put on the watch and showed it to everyone.`; confidence 0.9; After thanking, showing the watch fits; getting water is irrelevant and breaks flow.

### seven_select-sp-中考-zyhpxo
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) So I decided to make a card by myself. I got some colored paper, scissors and 
- Blank 4: current `1:She put it in a box and forgot about it.` -> suggested `-1:`; confidence 0.95; The passage states the mother put the card on the shelf, not in a box; option B contradicts the text.

### seven_select-sp-高考-10jy1qc
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today's fast-paced world, many people spend most of their workday sitting in front of a screen. This sedentary lifestyle can lead to various health problems, such as back pain a
- Blank 1: current `1:Not only does it improve physical health, but it also boosts mental well-being.` -> suggested `0:To address this issue, some companies have introduced standing desks.`; confidence 0.9; The previous sentence discusses health problems from a sedentary lifestyle; option A directly addresses the issue, while B's 'it' has no clear antecedent.
- Blank 5: current `6:Once you try it, you might find it hard to go back to traditional meetings.` -> suggested `5:Walking meetings are not suitable for all weather conditions.`; confidence 0.8; The passage ends with a general positive note; G is too specific and abrupt, while F would be a better fit before the final sentence about 'simple change'.

### seven_select-sp-高考-10x8zhy
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the importance of small talk. They see it as meaningless chatter that wastes time. (1) In fact, these brief exchanges can build bridges between strangers 
- Blank 3: current `0:However, many people avoid it because they fear awkward silences.` -> suggested `3:It also reduces social anxiety by providing a predictable routine.`; confidence 0.9; Option A introduces an unrelated avoidance behavior, breaking the positive flow about small talk's functions; D continues the logical sequence.
- Blank 4: current `5:Instead, they prefer to jump straight into serious discussions.` -> suggested `4:Even a brief chat can leave a positive impression on others.`; confidence 0.95; Option F contradicts the positive tone and does not lead to the conclusion; E supports the argument coherently.

### seven_select-sp-高考-120lsy1
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, it is easy to overlook the impact of small acts of kindness. (1) However, research shows that even the simplest gestures can significantly boost both the g
- Blank 4: current `2:Instead, focus on grand gestures that get noticed.` -> suggested `3:The warmth you spread often comes back to you in unexpected ways.`; confidence 0.95; Option C contradicts the passage's theme of small kindnesses; D fits the ripple effect and community support context.

### seven_select-sp-高考-12dbgz4
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that achieving big goals requires dramatic changes. However, research in psychology suggests that small, consistent habits can lead to remarkable transformation
- Blank 2: current `4:Eventually, you might find yourself reading dozens of books a year without effort.` -> suggested `1:B. These small wins build confidence and create a positive feedback loop.`; confidence 0.9; Option E is a distant outcome; the local coherence after the reading example calls for a comment on the small win, not a future result.
- Blank 3: current `3:Once the habit is established, you can expand it gradually.` -> suggested `4:E. Eventually, you might find yourself reading dozens of books a year without effort.`; confidence 0.85; Option D is redundant with the following sentence; Option E provides a concrete outcome for the reading example before the general principle.
- Blank 4: current `1:These small wins build confidence and create a positive feedback loop.` -> suggested `3:D. Once the habit is established, you can expand it gradually.`; confidence 0.8; Option B about small wins fits earlier; Option D logically follows the process focus and leads into the mindset shift.

### seven_select-sp-高考-12xn9xb
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced world, many people struggle with the pressure to say “yes” to every request. (1) However, constantly agreeing to others’ demands can lead to burnout and resen
- Blank 5: current `5:Some people find it easier to say no via email rather than face-to-face.` -> suggested `4:Therefore, it is crucial to practice saying no in a respectful manner.`; confidence 0.9; Option F introduces a narrow detail that does not conclude the passage; Option E provides a fitting general conclusion.

### seven_select-sp-高考-13yssx9
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. However, research shows that brief, casual conversations can significantly improve our social wel
- Blank 4: current `5:In fact, a simple greeting with a stranger can boost mood and create a sense of belonging.` -> suggested `0:These interactions are not just about filling silence; they build emotional connections.`; confidence 0.9; The current option repeats an earlier point, while the suggested option directly refers to 'these interactions' and logically follows the social lubricant idea.
- Blank 5: current `6:For example, chatting with a barista about the weather might lead to a shared laugh, which releases oxytocin and reduces stress.` -> suggested `5:In fact, a simple greeting with a stranger can boost mood and create a sense of belonging.`; confidence 0.85; The current option is an example that belongs earlier; the suggested option provides a summarizing statement that leads naturally to the concluding advice.

### seven_select-sp-高考-149dhbz
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. (1) In fact, these brief exchanges serve as social glue that connects individuals in various sett
- Blank 1: current `1:Yet these small talks can actually have a significant impact on our relationships.` -> suggested `0:People who are shy often struggle to start conversations with strangers.`; confidence 0.9; The concessive 'Yet' contradicts the following 'In fact', and the suggested option provides a contrast that fits the context better.
- Blank 5: current `0:People who are shy often struggle to start conversations with strangers.` -> suggested `4:Practice makes perfect when it comes to social interactions.`; confidence 0.95; The following sentence directly mentions practice, making the suggested option the natural lead-in; the current option about shyness is out of place here.

### seven_select-sp-高考-158xqym
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, viewing it as meaningless chatter. However, research has shown that these brief exchanges can significantly impact our social and
- Blank 1: current `0:They help create a sense of belonging in a community.` -> suggested `2:These interactions can also boost one's mood and reduce stress.`; confidence 0.8; The example of a greeting with a neighbor directly supports a sentence about mood/stress, not belonging, which is already implied.
- Blank 2: current `2:These interactions can also boost one's mood and reduce stress.` -> suggested `0:They help create a sense of belonging in a community.`; confidence 0.7; The workplace rapport example logically extends to community belonging, while mood/stress is less connected.
- Blank 4: current `6:Therefore, don't dismiss the power of a simple 'How are you?'.` -> suggested `5:Many successful leaders attribute their networking skills to small talk.`; confidence 0.8; After advice on effective small talk, a concrete example from leaders fits better than a direct exhortation, which suits the final blank.
- Blank 5: current `4:It is a skill that can be practiced and improved over time.` -> suggested `6:Therefore, don't dismiss the power of a simple 'How are you?'.`; confidence 0.9; The final blank needs a strong concluding remark; the exhortation is more fitting than a general skill-improvement statement.

### seven_select-sp-高考-15tyjjn
- Type: seven_select; exam: 高考; level: lv2
- Passage: A smile is one of the most powerful tools we have in human interaction. It can break down barriers and create connections almost instantly. (1) However, many of us underestimate th
- Blank 3: current `4:Conversely, a genuine smile can brighten someone's entire day.` -> suggested `1:B. True smiles come from the heart.`; confidence 0.85; Blank 3 follows discussion of forced smiles; B directly contrasts with forced smiles and leads into the Duchenne smile definition, while E's 'conversely' is less coherent.
- Blank 4: current `1:True smiles come from the heart.` -> suggested `4:E. Conversely, a genuine smile can brighten someone's entire day.`; confidence 0.8; Blank 4 precedes definition of Duchenne smile; E introduces genuine smile's positive effect, linking naturally to the definition, whereas B is too vague and disrupts flow.

### seven_select-sp-高考-15u85rf
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that constantly demands our attention, learning to say no is an essential skill for maintaining mental health. (1) However, many people struggle with this simple word be
- Blank 1: current `0:It helps you avoid overcommitting and reduces stress.` -> suggested `6:Actually, saying yes to everything leads to burnout and resentment.`; confidence 0.9; The blank follows 'However, many people struggle...' and needs a contrastive statement about the consequence of saying yes, not a benefit of saying no. Option G provides the needed contrast.
- Blank 2: current `4:Instead, they often say yes to everything and feel overwhelmed.` -> suggested `0:It helps you avoid overcommitting and reduces stress.`; confidence 0.85; Blank 2 follows a sentence about improving relationships and productivity; the current option E is a general statement about others, while option A directly explains how saying no helps, fitting the local coherence.
- Blank 3: current `5:You can start by declining small favors or unnecessary meetings.` -> suggested `2:By doing so, you train your brain to handle discomfort.`; confidence 0.8; Blank 3 follows a sentence about using a polite but firm tone and gives an example; the current option F is about starting small, which fits better in blank 4. Option C logically follows the example by explaining the benefit of practicing.
- Blank 4: current `2:By doing so, you train your brain to handle discomfort.` -> suggested `5:You can start by declining small favors or unnecessary meetings.`; confidence 0.85; Blank 4 follows 'practice saying no in low-stakes situations'; option F directly tells how to start, while option C is a general result that fits better after the example in blank 3.

### seven_select-sp-高考-16r466n
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world filled with constant noise, silence has become a rare treasure. Many people feel uncomfortable when there is a pause in conversation, rushing to fill it with words. (1) 
- Blank 2: current `2:In contrast, some Eastern cultures view silence as a way to show agreement.` -> suggested `3:However, in some Western countries, silence is often avoided at all costs.`; confidence 0.9; The current key (C) about Eastern cultures does not logically lead to the Finland example, which is a Western culture; option D provides a contrast that sets up the Finland example as an exception.

### seven_select-sp-高考-1784xsm
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. (1) In fact, these brief exchanges can strengthen social bonds and open doors to new opportunitie
- Blank 3: current `3:Without it, people may feel isolated or miss valuable chances to connect.` -> suggested `6:G. Others believe it is a waste of precious time.`; confidence 0.9; The preceding sentences praise small talk; blank 3 needs a contrasting negative view to lead into 'However, not everyone feels confident...' Option D is a consequence, not a contrast, while G directly provides the needed contrast.

### seven_select-sp-高考-17li2eh
- Type: seven_select; exam: 高考; level: lv2
- Passage: In recent years, the concept of micro-habits has gained increasing attention among psychologists and self-improvement enthusiasts. (1) Unlike grand resolutions that often fail with
- Blank 2: current `1:However, their real power is often underestimated.` -> suggested `2:Once you start, you will feel motivated to do more.`; confidence 0.85; The current option 'However, their real power is often underestimated' introduces a contrast that is not supported by the following sentence 'Over time, however, these small steps accumulate...' which instead builds on the idea of starting and accumulating. The suggested option provides a logical bridge from the example to the accumulation effect.
- Blank 4: current `3:They are the foundation of long-term success.` -> suggested `6:This principle works in various areas of life.`; confidence 0.9; The blank is followed by specific examples (writer, student) that illustrate the principle in different areas, so 'This principle works in various areas of life' directly introduces those examples. The current option 'They are the foundation of long-term success' is a general statement that fits better earlier in the passage.

### seven_select-sp-高考-19xoqgr
- Type: seven_select; exam: 高考; level: lv2
- Passage: Maps are not just tools for finding directions; they are windows into how people understand and organize the world. (1) In fact, reading a map is a skill that combines observation,
- Blank 5: current `0:Many people rely on digital maps today, but paper maps still have unique advantages.` -> suggested `6:These updates ensure that maps remain useful for travelers.`; confidence 0.9; The preceding sentence discusses maps changing over time, and option G directly refers to 'these updates' and their benefit, maintaining coherence. Option A is a general statement that does not connect to the previous sentence about change.

### seven_select-sp-高考-1a6qpgo
- Type: seven_select; exam: 高考; level: lv2
- Passage: Friendship is one of the most valuable relationships in life, yet maintaining it over time is not always easy. (1) However, true friendship requires more than just shared interests
- Blank 1: current `0:Many people believe that friendship happens naturally without any effort.` -> suggested `6:Without mutual effort, even the best friendship can fade away.`; confidence 0.85; The passage opens with the difficulty of maintaining friendship, and the 'However' in the next sentence requires a preceding statement that effort is needed. Option A contradicts this flow, while G directly sets up the contrast.

### seven_select-sp-高考-1aymfo8
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, it's easy to overlook the impact of small gestures. (1) However, research shows that even tiny acts of kindness can significantly boost both the giver's an
- Blank 4: current `5:Therefore, it is important to teach children the value of kindness from an early age.` -> suggested `3:For example, a study found that participants who received a small gift were more willing to help others later.`; confidence 0.9; Blank 4 follows 'kindness is contagious' and needs a supporting example; D fits, while F is a concluding statement that belongs later.
- Blank 5: current `3:For example, a study found that participants who received a small gift were more willing to help others later.` -> suggested `5:Therefore, it is important to teach children the value of kindness from an early age.`; confidence 0.9; Blank 5 is the final sentence before the concluding remark; F provides a logical concluding point, whereas D is an example that fits earlier.

### seven_select-sp-高考-1b8cfum
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where everyone seems to be talking, the art of listening is becoming rare. (1) However, silence can be a powerful tool in communication, often conveying more than words 
- Blank 1: current `1:Silence allows both parties to reflect on what has been said.` -> suggested `2:It is often said that silence is golden, but few truly understand its power.`; confidence 0.85; The passage opens with the rarity of listening; a general statement about silence's value (C) bridges naturally to the examples, while B jumps to a specific benefit too early.

### seven_select-sp-高考-1cyfncd
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies being busy, learning to say no is an essential skill for maintaining mental health and personal boundaries. (1) However, many people struggle with t
- Blank 2: current `3:Instead, they often say yes reluctantly and later regret it.` -> suggested `1:Many people believe that saying yes to everything is the key to success.`; confidence 0.9; The current option D lacks a clear antecedent for 'they', while option B introduces a common misconception that contrasts with the previous sentence and leads into the next.
- Blank 3: current `1:Many people believe that saying yes to everything is the key to success.` -> suggested `3:Instead, they often say yes reluctantly and later regret it.`; confidence 0.85; Option B is a general statement that does not connect well; option D provides a contrastive example that fits the flow of explaining why saying no is beneficial.

### seven_select-sp-高考-1e16wpn
- Type: seven_select; exam: 高考; level: lv2
- Passage: Learning to say no is an essential skill in modern life. Many people feel pressured to agree to every request, fearing that refusal might damage relationships. (1) In fact, constan
- Blank 3: current `0:However, saying no does not mean being rude or unhelpful.` -> suggested `2:Instead, it can be done politely and with empathy.`; confidence 0.9; The preceding sentence gives an example of polite refusal; 'However' introduces an unnecessary contrast, while 'Instead' directly continues the idea.

### seven_select-sp-高考-1eir1j3
- Type: seven_select; exam: 高考; level: lv2
- Passage: In recent years, the concept of micro-habits has gained widespread popularity. Unlike grand resolutions that often fail, micro-habits are tiny, manageable actions that require mini
- Blank 5: current `5:A micro-habit might seem insignificant at first.` -> suggested `4:Gradually, you can expand them into larger routines.`; confidence 0.9; F is an introductory remark that belongs earlier; E logically follows 'increase the difficulty' and leads into the conclusion about successful people.

### seven_select-sp-高考-1eob417
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where constant chatter and digital noise are the norm, the value of silence is often overlooked. (1) In fact, silence can be a powerful tool in communication, conveying 
- Blank 2: current `4:In fact, silence can be more powerful than words in certain situations.` -> suggested `3:Silence gives both sides a chance to reconsider their positions.`; confidence 0.9; The preceding sentence describes a tense negotiation; option D directly continues that specific scenario, while E is a general statement that fits better earlier.

### seven_select-sp-高考-1fdvgj4
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a small village nestled between green hills, there was a bamboo grove that everyone spoke of in whispers. The grove was said to be enchanted, but no one dared to enter after sun
- Blank 4: current `5:Instead of magic, he found a beautiful natural phenomenon.` -> suggested `2:C. He carefully collected some insects to show his friends at school.`; confidence 0.9; Blank 4 follows the discovery of glowing insects; collecting insects is a logical next action, while F repeats the discovery already stated in blank 3.

### seven_select-sp-高考-1gxrgid
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people struggle to make lasting changes in their lives, often because they set overly ambitious goals. (1) Instead, they can achieve remarkable results by focusing on micro-ha
- Blank 1: current `4:This is why many people give up on their New Year's resolutions within weeks.` -> suggested `3:Instead of relying on willpower, they should design their environment for success.`; confidence 0.85; Option E introduces a new topic (New Year's resolutions) not locally coherent; Option D directly contrasts with the previous sentence about overly ambitious goals and offers a clear alternative.

### seven_select-sp-高考-1hfy3mx
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often find ourselves agreeing to do things we don't really want to. This can lead to stress and burnout. (1) Learning to say no is a valuable skill that can 
- Blank 1: current `0:Setting clear boundaries helps you focus on what truly matters.` -> suggested `6:Learning to refuse can be uncomfortable at first.`; confidence 0.85; Option G directly follows the idea of stress/burnout and introduces the discomfort of learning to say no, while A is a general statement that fits better later.
- Blank 4: current `6:Learning to refuse can be uncomfortable at first.` -> suggested `0:Setting clear boundaries helps you focus on what truly matters.`; confidence 0.8; After the example of polite refusal, A about setting boundaries leads naturally to practicing and gaining respect; G about discomfort is out of place here.

### seven_select-sp-高考-1hv850y
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that achieving big goals requires dramatic changes. However, research in psychology suggests that small, consistent habits can be surprisingly powerful. (1) For
- Blank 4: current `3:Even a five-minute walk can improve your mood significantly.` -> suggested `2:Once habits are formed, they run on autopilot.`; confidence 0.9; The blank follows a sentence about automatic behavior and precedes a teeth-brushing example; Option C directly explains automaticity, while D introduces an unrelated mood example, breaking logical flow.

### seven_select-sp-高考-1hwdw3x
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies busyness, learning to say no can be a powerful act of self-care. (1) However, many people find themselves agreeing to requests they would rather dec
- Blank 3: current `3:Learning to say no allows you to focus on what truly matters.` -> suggested `4:E. On the contrary, it enables you to be more present for the commitments you do make.`; confidence 0.9; Blank 3 follows 'Setting boundaries is not about being selfish; it is about protecting your time and energy.' The phrase 'On the contrary' directly contrasts the preceding negative statement, and 'it' refers to setting boundaries. Option D is a general statement that fits better later.
- Blank 5: current `4:On the contrary, it enables you to be more present for the commitments you do make.` -> suggested `3:D. Learning to say no allows you to focus on what truly matters.`; confidence 0.85; Blank 5 is the concluding sentence before 'Ultimately, saying no to others means saying yes to your own priorities.' Option D provides a natural summary that aligns with the final line, while E's 'On the contrary' has no preceding negative clause to contrast with here.

### seven_select-sp-高考-1jex40r
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, meaningful conversations are often replaced by quick messages and emojis. However, the art of small talk still holds great value in building social connect
- Blank 3: current `2:It is a way to find common ground without putting too much pressure on either party.` -> suggested `6:Actually, it plays a much deeper role in our social lives.`; confidence 0.85; The paragraph contrasts 'not just about filling silence' with a deeper role; G fits perfectly, while C repeats the common ground idea already covered.

### seven_select-sp-高考-1jzolxs
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where constant chatter is often encouraged, the value of silence is frequently overlooked. (1) However, silence can be a powerful tool in communication, allowing for dee
- Blank 2: current `4:Silence, when used intentionally, can convey messages that words cannot.` -> suggested `3:Those who are comfortable with silence tend to be better listeners.`; confidence 0.85; Option E is a general statement that does not logically connect to the preceding sentence about pausing or the following sentence about preventing misunderstandings. Option D directly follows from the idea of pausing and leads naturally to 'This can prevent misunderstandings'.
- Blank 3: current `5:It is important to note that silence is not always golden.` -> suggested `0:Many people feel anxious when there is a long pause in a conversation.`; confidence 0.7; Option F introduces a negative note that disrupts the positive flow of examples about silence in cultures and negotiations. Option A provides a contrasting perspective that fits better with the later shift to discomfort with silence.
- Blank 4: current `1:Silence can also be used as a form of punishment in some social settings.` -> suggested `5:It is important to note that silence is not always golden.`; confidence 0.9; Option B introduces an unrelated negative concept that does not connect to the following sentence about confidence. Option F serves as a better transition to the negative aspect and prepares for the next paragraph.

### seven_select-sp-高考-1k724nn
- Type: seven_select; exam: 高考; level: lv2
- Passage: Sleep is essential for our health, yet many people struggle to get enough quality rest. (1) However, there are several effective strategies that can help improve your sleep quality
- Blank 3: current `0:Additionally, engaging in physical activity during the day can help you fall asleep faster at night.` -> suggested `2:Investing in a good mattress and pillows can also make a big difference.`; confidence 0.9; Option A (daytime exercise) is a separate strategy, not directly related to the sleep environment paragraph; Option C naturally extends the environment topic.
- Blank 4: current `2:Investing in a good mattress and pillows can also make a big difference.` -> suggested `0:Additionally, engaging in physical activity during the day can help you fall asleep faster at night.`; confidence 0.9; Option C (mattress/pillows) belongs with blank 3's environment paragraph; Option A fits as a general strategy before the concluding 'Finally'.

### seven_select-sp-高考-1lcoh8q
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, viewing it as a waste of time. However, research shows that brief, casual conversations can have significant social and psycholog
- Blank 3: current `1:Small talk is often seen as superficial and meaningless.` -> suggested `2:Without these small exchanges, it's hard to build trust.`; confidence 0.9; The current key repeats the opening idea, breaking the logical progression from community building to loneliness reduction; option C provides a necessary contrast and leads naturally to the oxytocin explanation.

### seven_select-sp-高考-1mentih
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. (1) In fact, these brief exchanges can strengthen social bonds and open doors to new opportunitie
- Blank 3: current `4:This skill can be especially useful when meeting new people in social events.` -> suggested `2:C = "Instead, they can avoid small talk by staying silent or using their phones."`; confidence 0.9; The preceding sentence discusses people who find small talk awkward; option C logically continues by describing an avoidance behavior, while E introduces a new skill unrelated to the difficulty.

### seven_select-sp-高考-1muzc9n
- Type: seven_select; exam: 高考; level: lv2
- Passage: Sleep is something we all need, yet many of us struggle to get enough of it. (1) In fact, poor sleep can affect our mood, memory, and even our immune system. So what can we do to i
- Blank 4: current `1:Poor sleep has become a common problem in modern society.` -> suggested `4:Also, avoid using electronic devices before bed.`; confidence 0.95; The sentence about blue light directly leads to advice against screens, not a general statement about poor sleep.
- Blank 3: current `4:Also, avoid using electronic devices before bed.` -> suggested `2:A warm bath or reading a book can help you relax.`; confidence 0.9; After 'create a relaxing bedtime routine' and 'signals to wind down', an example of a relaxing activity fits, not a warning about devices.

### seven_select-sp-高考-1mwslon
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where we are constantly surrounded by noise, silence is often undervalued. (1) However, silence can be a powerful tool in communication, offering space for reflection an
- Blank 2: current `2:It is often seen as an empty space that needs to be filled with conversation.` -> suggested `1:B. Silence can also give the speaker a chance to gather their thoughts.`; confidence 0.9; Option C introduces a negative view that disrupts the positive flow; Option B logically continues the idea of silence benefiting the speaker after pausing to process.
- Blank 3: current `1:Silence can also give the speaker a chance to gather their thoughts.` -> suggested `2:C. It is often seen as an empty space that needs to be filled with conversation.`; confidence 0.85; Option B about speaker gathering thoughts does not fit the cultural example; Option C contrasts with the positive example and leads naturally into the 'Yet' in blank 4.

### seven_select-sp-高考-1n0v69v
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies busyness, learning to say no is a valuable skill. Many people feel guilty when they decline an invitation or refuse a request. (1) However, constant
- Blank 5: current `1:Many people mistakenly think that saying no is rude or selfish.` -> suggested `6:Choosing when to say yes and when to say no is a form of self-respect.`; confidence 0.9; B introduces an undeveloped misconception, while G provides a fitting concluding thought that aligns with the final sentence.

### seven_select-sp-高考-1p6w8ax
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many successful people attribute their achievements to a well-structured morning routine. (1) However, establishing such a routine can be challenging for most of us. The key is to 
- Blank 2: current `3:It also helps you avoid feeling rushed in the morning.` -> suggested `2:C. Without it, you might waste time deciding what to do next.`; confidence 0.9; Option D about avoiding rush does not logically follow the waking-up-15-minutes-earlier example; Option C connects to the next sentence about reducing decision fatigue.
- Blank 3: current `2:Without it, you might waste time deciding what to do next.` -> suggested `3:D. It also helps you avoid feeling rushed in the morning.`; confidence 0.85; Blank 3 follows 'reduces decision fatigue'; Option D continues the list of benefits naturally, while Option C is better suited for blank 2.

### seven_select-sp-高考-1pqnl7m
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, viewing it as trivial or a waste of time. (1) In fact, these brief exchanges can serve as social glue, helping to build connectio
- Blank 3: current `6:They prefer to avoid it because they fear awkward silences.` -> suggested `0:Some people find it difficult to break the ice in social situations.`; confidence 0.85; Option G at blank 3 repeats the idea of avoidance without explaining the reason, while option A directly follows 'not everyone is comfortable' and leads into the solution in blank 4.
- Blank 4: current `0:Some people find it difficult to break the ice in social situations.` -> suggested `6:They prefer to avoid it because they fear awkward silences.`; confidence 0.85; Option A at blank 4 is redundant after blank 3's suggested fix; option G provides a reason for avoidance that 'With practice' can address, improving coherence.

### seven_select-sp-高考-1q0y71m
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world filled with constant noise, silence is often undervalued. (1) However, silence can be a powerful tool in communication, offering space for reflection and deeper understa
- Blank 1: current `0:Many people feel uncomfortable when a conversation falls silent.` -> suggested `5:Silence is not merely the absence of sound; it is a form of expression.`; confidence 0.9; Option A introduces discomfort, but the following 'However' contrasts with the idea that silence is undervalued; Option F directly defines silence as expressive, fitting the contrast.
- Blank 4: current `1:By remaining silent, we can also avoid saying something we might later regret.` -> suggested `3:A moment of silence can also help diffuse tension in a heated argument.`; confidence 0.8; Option B is about self-control, not conveying emotions; Option D relates to emotional regulation and fits better with the context of emotional expression and the following example.

### seven_select-sp-高考-1qv8tlb
- Type: seven_select; exam: 高考; level: lv2
- Passage: Have you ever been introduced to someone, only to forget their name seconds later? It’s a common experience that can be awkward and embarrassing. (1) In fact, remembering names is 
- Blank 5: current `1:However, if you do forget a name, don’t panic.` -> suggested `0:Most people will appreciate your honesty rather than feel offended.`; confidence 0.95; The current option B is already used earlier and does not logically follow the polite request; the suggested option provides a natural consequence.

### seven_select-sp-高考-1qwer0g
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world filled with constant stimulation, boredom has become something we try to avoid at all costs. (1) However, recent research suggests that boredom is not only normal but al
- Blank 3: current `1:Actually, boredom can be a powerful tool for sparking creativity.` -> suggested `2:C. These wandering thoughts can lead to innovative solutions to problems.`; confidence 0.9; Blank 3 follows an example about inventions and art; 'These wandering thoughts' directly refers to the mind-wandering in blank 2, while B is too general and redundant with the preceding sentence.

### seven_select-sp-高考-1rsynow
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that achieving big goals requires dramatic changes. However, research suggests that small, consistent habits can lead to remarkable results over time. (1) For e
- Blank 3: current `1:Many people, however, ignore the power of habits.` -> suggested `4:E. Yet most people fail because they try to change too much at once.`; confidence 0.9; The current key B does not logically follow the compound effect statement; E provides the needed contrast for 'Instead, they rely on motivation.'
- Blank 4: current `4:Yet most people fail because they try to change too much at once.` -> suggested `1:B. Many people, however, ignore the power of habits.`; confidence 0.85; After blank 3 is corrected to E, B fits as a contrast to the failure reason and leads into 'On the other hand...'

### seven_select-sp-高考-1s2ex3p
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, viewing it as trivial or a waste of time. (1) In fact, these brief exchanges can serve as the foundation for deeper relationships
- Blank 3: current `1:These skills are essential for both personal and professional growth.` -> suggested `5:F. By noticing details in what others say, you become a better communicator.`; confidence 0.9; Option B's 'these skills' has no clear antecedent; Option F logically follows the example about shared interests.
- Blank 4: current `5:By noticing details in what others say, you become a better communicator.` -> suggested `1:B. These skills are essential for both personal and professional growth.`; confidence 0.9; Option F at blank 4 disrupts flow; 'active listening and observation skills' in the next sentence refer to F, so B naturally concludes.

### seven_select-sp-高考-1s4pq7o
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that achieving great success requires dramatic changes. However, research shows that small, consistent habits can lead to remarkable results over time. (1) For 
- Blank 4: current `3:Therefore, we must set ambitious goals from the start.` -> suggested `1:Instead, we should aim for big leaps to see quick results.`; confidence 0.9; Option D contradicts the passage's contrast between gradual change and trying to change everything at once; B correctly follows 'On the other hand' as the opposite approach.

### seven_select-sp-高考-1stkzrs
- Type: seven_select; exam: 高考; level: lv2
- Passage: Learning to say no is a crucial life skill that many people struggle with. (1) However, constantly saying yes to every request can lead to burnout and resentment. The key is to rec
- Blank 1: current `3:However, constantly saying yes to every request can lead to burnout and resentment.` -> suggested `0:Many people fear that saying no will damage their relationships.`; confidence 0.95; The current key repeats the same sentence as the following text, breaking logical flow; the suggested option introduces a common fear that contrasts with the next sentence.

### seven_select-sp-高考-1t4m82y
- Type: seven_select; exam: 高考; level: lv2
- Passage: In an age where digital distractions are everywhere, the simple act of reading a book quietly seems to be losing its appeal. However, research shows that silent reading offers uniq
- Blank 5: current `3:Many students prefer reading in groups because they can discuss ideas with classmates.` -> suggested `5:This is why many teachers recommend silent reading time in classrooms.`; confidence 0.9; Group reading contradicts the passage's focus on silent reading; the suggested option maintains coherence.

### seven_select-sp-高考-1tjuy70
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often find ourselves agreeing to requests that we would rather decline. This can lead to stress and burnout. (1) Learning to say no is a valuable skill that 
- Blank 2: current `3:Thus, you might give in just to keep the peace.` -> suggested `0:Instead of feeling guilty, you can view it as a way to prioritize what truly matters.`; confidence 0.85; Option D leads to giving in, but the next sentence contradicts that by advocating polite refusal; Option A provides a positive reframing that bridges the struggle to the following advice.

### seven_select-sp-高考-1tnnhxb
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people dream of speaking a second language fluently, but few achieve it. (1) In fact, the key lies in consistent daily practice rather than occasional intensive study. (2) For
- Blank 5: current `5:This method helps you remember words in the long term.` -> suggested `6:G. Even if you make mistakes, keep practicing.`; confidence 0.9; Option F is vague and does not connect to the concluding advice about mistakes; G directly echoes the theme of persisting despite errors.

### seven_select-sp-高考-1ttodg6
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today's digital age, the internet has become an essential part of our daily lives. (1) However, it also brings various security risks that we must be aware of. One common threat
- Blank 3: current `3:Examples include your name or birth date, which are easy to guess.` -> suggested `2:C. Using the same password for all sites is a bad habit to avoid.`; confidence 0.85; The passage transitions from 'use strong, unique passwords' to 'A good password should contain...' Option D gives examples of weak passwords, but the logical flow is about avoiding bad habits like reusing passwords, which option C directly addresses.

### seven_select-sp-高考-1typtbc
- Type: seven_select; exam: 高考; level: lv2
- Passage: Reading aloud is a simple yet powerful activity that benefits both children and adults. (1) It also strengthens the bond between the reader and the listener. For children, being re
- Blank 3: current `3:It can turn a passive activity into an interactive one.` -> suggested `5:F. This practice also enhances comprehension and critical thinking.`; confidence 0.85; D is too generic; F directly continues the benefit list for adults.
- Blank 4: current `5:This practice also enhances comprehension and critical thinking.` -> suggested `3:D. It can turn a passive activity into an interactive one.`; confidence 0.8; D fits the classroom engagement context better than F.
- Blank 5: current `2:Parents often find it hard to make time for reading aloud every day.` -> suggested `4:E. However, some people argue that reading aloud is too time-consuming.`; confidence 0.9; E provides a logical contrast to the preceding sentence; C is too specific and disrupts flow.

### seven_select-sp-高考-1vavipr
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced world, we are constantly surrounded by entertainment—smartphones, social media, and streaming services keep us occupied every second. (1) However, a growing n
- Blank 3: current `0:Many people fear boredom and try to escape it at all costs.` -> suggested `5:In fact, some studies show that boredom can even boost problem-solving skills.`; confidence 0.9; Option A introduces a new topic (fear/escape) that breaks the logical flow; the preceding sentence discusses creative ideas from mental wandering, and the following sentence 'This can lead to increased anxiety' needs a cause. Option F provides a positive elaboration on boredom's benefits, maintaining coherence.

### seven_select-sp-高考-1vg2560
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies being busy, learning to say no is a valuable skill. Many people struggle with this simple word because they fear disappointing others or missing out
- Blank 1: current `4:Learning to decline politely can improve your relationships in the long run.` -> suggested `3:Many people find it easier to say yes in the moment.`; confidence 0.9; Option D provides a direct contrast to the struggle with saying no, fitting the 'However' transition naturally, while Option E shifts to a positive outcome prematurely.
- Blank 5: current `3:Many people find it easier to say yes in the moment.` -> suggested `5:You might feel guilty at first, but it gets easier with practice.`; confidence 0.85; Option D is already used at blank 1; Option F offers a logical emotional follow-up to evaluating requests and leads into the concluding remark about prioritizing oneself.

### seven_select-sp-高考-1wiyl7x
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our busy lives, we often overlook the impact of small gestures. (1) However, a simple act of kindness can brighten someone’s entire day. For instance, holding the door for a str
- Blank 5: current `0:We tend to think that only big actions can change the world.` -> suggested `4:Sometimes the smallest gesture leaves the deepest impression.`; confidence 0.9; Option A contradicts the passage's emphasis on small gestures; E reinforces the concluding message.

### seven_select-sp-高考-1wpbao5
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often find ourselves agreeing to do things we don’t really want to do. (1) However, learning to say “no” is an essential skill for maintaining healthy relati
- Blank 1: current `3:Without this ability, you may end up feeling exhausted and resentful.` -> suggested `0:By doing so, you avoid overcommitting and reduce your stress levels.`; confidence 0.8; Option D lacks a clear antecedent for 'this ability'; Option A logically follows the general statement about agreeing to unwanted things.
- Blank 3: current `0:By doing so, you avoid overcommitting and reduce your stress levels.` -> suggested `3:Without this ability, you may end up feeling exhausted and resentful.`; confidence 0.9; Option A's 'By doing so' has no clear referent; Option D logically connects to the preceding advice about saying no.

### seven_select-sp-高考-1xs2z1j
- Type: seven_select; exam: 高考; level: lv2
- Passage: Learning a new language is often seen as a challenging task, but it can be one of the most rewarding experiences in life. (1) The key is to find methods that work for you and stick
- Blank 2: current `3:Mistakes are nothing to be afraid of.` -> suggested `0:However, this belief is not entirely true.`; confidence 0.95; The current option D about mistakes breaks the contrastive flow; option A directly refutes the preceding belief and connects naturally to 'In fact...'
- Blank 4: current `4:Watching videos without subtitles is a great way to test your listening skills.` -> suggested `3:Mistakes are nothing to be afraid of.`; confidence 0.95; Option E about watching videos is unrelated to mistakes; option D directly addresses mistakes and leads naturally into 'However, it is through these errors...'

### seven_select-sp-高考-1yc4yy8
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that a good memory is something you are born with, but research shows it can be trained. (1) In fact, our brain is like a muscle — the more you use it, the stro
- Blank 5: current `5:Therefore, it is better to study alone than in a group.` -> suggested `4:Exercise increases blood flow to the brain, which improves concentration and recall.`; confidence 0.95; The passage's final sentence discusses staying physically active, so E directly supports it; F about studying alone is irrelevant.

### seven_select-sp-高考-4bitly
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where we are constantly surrounded by noise, silence is often undervalued. (1) However, silence can be a powerful tool in communication, conveying meaning that words som
- Blank 1: current `0:Many people feel the need to fill every pause with words.` -> suggested `6:Actually, silence can be more powerful than words in certain situations.`; confidence 0.9; Option A shifts focus to people's behavior, breaking the logical flow from 'silence is undervalued' to 'However, silence can be a powerful tool'. Option G directly contrasts the undervaluing and introduces the positive power.

### seven_select-sp-高考-4fsmnp
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often overlook the impact of small acts of kindness. (1) However, these seemingly insignificant gestures can actually create a ripple effect that spreads far
- Blank 2: current `0:Many people believe that only grand gestures can make a difference.` -> suggested `6:The warmth of a kind word can last much longer than the moment itself.`; confidence 0.9; The current option about grand gestures is off-topic after the door-holding example; G provides a fitting elaboration on lasting impact.
- Blank 4: current `3:However, the effects of such deeds are often underestimated.` -> suggested `2:Witnessing kindness encourages others to act similarly.`; confidence 0.95; The current option repeats underestimation from blank 1; C directly explains the contagion mechanism mentioned before the blank.

### seven_select-sp-高考-53ob9m
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often feel pressured to say “yes” to every request, whether from friends, family, or colleagues. (1) However, constantly agreeing can lead to stress, burnout
- Blank 2: current `1:Setting boundaries can actually improve your mental health.` -> suggested `3:It also prevents you from overcommitting and feeling exhausted.`; confidence 0.9; The following sentence 'It helps you focus...' directly continues the idea of 'saying no' with 'It', and 'also' in option D provides a coherent link, while B introduces a new topic.
- Blank 4: current `3:It also prevents you from overcommitting and feeling exhausted.` -> suggested `1:Setting boundaries can actually improve your mental health.`; confidence 0.8; Option B transitions naturally from respect to mental health benefits, while D is better placed earlier and repeats 'also' awkwardly.

### seven_select-sp-高考-6dyojt
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies being busy, learning to say "no" has become an essential skill for maintaining mental health. (1) Many people find themselves overwhelmed by endless
- Blank 5: current `3:Learning to decline politely is a sign of weakness in many cultures.` -> suggested `5:F. The ability to say no can free up time for activities that bring you joy.`; confidence 0.9; Option D contradicts the passage's positive advocacy for saying no; Option F aligns with the concluding focus on what truly matters.

### seven_select-sp-高考-8uxcny
- Type: seven_select; exam: 高考; level: lv2
- Passage: Learning to say no is an essential skill in modern life. Many people feel pressured to agree to every request, fearing they might disappoint others or miss opportunities. (1) Howev
- Blank 2: current `1:Many people mistakenly believe that saying no is rude or selfish.` -> suggested `3:Instead, they should learn to prioritize their own well-being.`; confidence 0.9; Option B introduces a general misconception, but the following example of refusing a colleague directly supports the idea of prioritizing well-being, making D a better fit.

### seven_select-sp-高考-aktvza
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our modern world, we are constantly surrounded by noise. From the buzz of smartphones to the chatter in crowded spaces, silence has become a rare commodity. (1) However, silence
- Blank 2: current `3:This is why public speakers often use pauses to emphasize key points.` -> suggested `1:Silence can also be misunderstood as disinterest or anger.`; confidence 0.85; Option D shifts topic to public speakers, while Option B provides a contrasting nuance that fits the flow after the general statement about pauses.
- Blank 4: current `2:By doing so, we create space for empathy and deeper connection.` -> suggested `4:Without silence, true reflection and understanding become difficult.`; confidence 0.9; Option C's 'By doing so' lacks a clear antecedent; Option E directly supports the idea of silence being essential for reflection.

### seven_select-sp-高考-av6dd6
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, many people think that speaking is the most important communication skill. However, listening is equally, if not more, crucial for building strong relation
- Blank 3: current `3:This is because our minds tend to wander when others speak.` -> suggested `1:Remember, listening is a skill that can be developed.`; confidence 0.9; The statistic about remembering 25% is naturally followed by an explanation (minds wander), not a motivational statement. Option D fits the cause-effect flow.
- Blank 4: current `1:Remember, listening is a skill that can be developed.` -> suggested `3:This is because our minds tend to wander when others speak.`; confidence 0.9; After the statistic, the logical next sentence explains why, then advice follows. Current answer B disrupts the sequence.
- Blank 5: current `2:Many people prefer talking over listening in daily life.` -> suggested `1:Remember, listening is a skill that can be developed.`; confidence 0.85; Option C is a general observation unrelated to the preceding advice or concluding sentence. Option B reinforces the theme and leads naturally to the final sentence.

### seven_select-sp-高考-ay9nty
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, viewing it as meaningless chatter. However, research shows that brief, casual conversations can significantly boost our sense of 
- Blank 3: current `5:On the contrary, avoiding small talk may lead to feelings of isolation.` -> suggested `2:C. Small talk can also improve our communication skills over time.`; confidence 0.85; Option F introduces a contrast about avoiding small talk, which disrupts the positive flow of benefits; Option C adds another benefit, maintaining coherence.

### seven_select-sp-高考-b0dtej
- Type: seven_select; exam: 高考; level: lv2
- Passage: When we walk through a forest, we often see trees as silent, solitary giants. (1) In reality, they are connected by a vast underground network of fungi, often called the 'Wood Wide
- Blank 4: current `2:This discovery has led to new methods in agricultural pest control.` -> suggested `4:E. However, not all trees participate equally in this sharing system.`; confidence 0.9; The current option C introduces an unrelated topic (agricultural pest control) that breaks the logical flow of cooperative signaling and forest community survival.
- Blank 5: current `4:However, not all trees participate equally in this sharing system.` -> suggested `2:C. This discovery has led to new methods in agricultural pest control.`; confidence 0.8; The current option E about unequal participation is out of place in the concluding paragraph; the suggested option C provides a more natural transition to implications for logging and conservation.

### seven_select-sp-高考-b2egx8
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often find ourselves agreeing to requests that we would rather decline. Whether it’s a friend asking for a favor or a colleague requesting extra work, the pr
- Blank 3: current `5:Some people feel guilty when they refuse a request.` -> suggested `2:C. By setting boundaries, you can focus on your own goals.`; confidence 0.85; The context after blank 3 discusses freeing up time for what matters, and option C directly continues that theme, while F introduces guilt which is not supported.

### seven_select-sp-高考-bdv1nb
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced society, we are constantly surrounded by noise—from traffic, smartphones, and endless notifications. Yet, amidst this chaos, the ability to truly listen has b
- Blank 3: current `5:Without good listening, even the best intentions can be misunderstood.` -> suggested `2:Unfortunately, we often fail to listen because we are too busy with our own thoughts.`; confidence 0.85; The current sentence about misunderstandings does not logically lead into 'This is because listening requires patience...' whereas the suggested sentence about failing to listen due to being busy with own thoughts directly explains the preceding contrast and sets up the causal link.

### seven_select-sp-高考-bim3h2
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that success comes from sudden bursts of inspiration or extraordinary talent. However, research shows that consistent daily habits play a far more important rol
- Blank 5: current `0:This is why many people fail to achieve their goals despite having big dreams.` -> suggested `4:Similarly, a student who reviews just one page of notes daily will master a subject by the end of a term.`; confidence 0.95; A introduces a negative cause-effect that clashes with the positive concluding tone; E provides a parallel example reinforcing the 'small steps' message.

### seven_select-sp-高考-c1vo7j
- Type: seven_select; exam: 高考; level: lv2
- Passage: Small talk, often dismissed as meaningless chatter, actually plays a significant role in our social lives. (1) It serves as a social lubricant that helps people connect on a basic 
- Blank 1: current `1:Many people underestimate the importance of small talk.` -> suggested `0:It helps to build rapport and trust over time.`; confidence 0.9; Option B introduces a new idea about underestimation, breaking the flow; A directly continues the explanation of small talk's role.
- Blank 3: current `0:It helps to build rapport and trust over time.` -> suggested `6:Listening actively is another crucial aspect of successful small talk.`; confidence 0.85; Option A is already used in blank 1 and is misplaced here; G logically follows the mention of being curious.

### seven_select-sp-高考-d7k5dt
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, many people underestimate the value of small talk. (1) However, these brief exchanges can actually play a significant role in building social connections. 
- Blank 2: current `0:These moments of connection can reduce stress and make people feel more comfortable.` -> suggested `3:It also helps to smooth over awkward silences in social situations.`; confidence 0.9; Option A introduces a new idea (stress reduction) that breaks the logical flow from 'not just passing time' to 'initial casual interaction opens the door'. Option D directly continues the function of small talk and connects smoothly.
- Blank 3: current `3:It also helps to smooth over awkward silences in social situations.` -> suggested `0:These moments of connection can reduce stress and make people feel more comfortable.`; confidence 0.85; Option D about awkward silences fits better earlier. Option A about reducing stress and comfort logically extends the idea of belonging and approachability, leading naturally to the professional setting paragraph.

### seven_select-sp-高考-efu6vg
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often think that effective communication depends entirely on words. (1) However, silence can be just as powerful as speech in conveying meaning. For instance
- Blank 5: current `0:Many people feel uncomfortable when there is a long pause in a conversation.` -> suggested `2:However, silence is not always welcome in every situation.`; confidence 0.85; The concluding paragraph discusses learning to use silence appropriately, which requires a preceding statement that silence can be problematic. Option C provides that contrast, while Option A is a general statement that does not lead into the conclusion.

### seven_select-sp-高考-egt3b
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced work environment, many people spend hours sitting in conference rooms. However, a growing number of companies are encouraging employees to hold walking meetin
- Blank 2: current `4:They found that walking increased creative output by 60%.` -> suggested `0:A. This simple change can lead to more productive discussions.`; confidence 0.9; Option E lacks a clear referent for 'They' and disrupts the logical flow from the general claim to the example; A provides a cohesive link.
- Blank 3: current `0:This simple change can lead to more productive discussions.` -> suggested `4:E. They found that walking increased creative output by 60%.`; confidence 0.85; Option A is too generic and does not follow the Steve Jobs example as well as E, which provides specific evidence and transitions to additional benefits.
- Blank 5: current `5:Walking meetings are not suitable for all situations.` -> suggested `6:G. People who walk regularly tend to live longer.`; confidence 0.8; Option F introduces a contradictory limitation at the end of a positive buildup; G reinforces the health benefits and leads naturally to the concluding suggestion.

### seven_select-sp-高考-evt358
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that constantly demands our attention and time, learning to say no is an essential skill for maintaining mental health and personal boundaries. (1) Many people find them
- Blank 2: current `6:Learning to say no does not mean you are being rude or uncooperative.` -> suggested `0:The ability to say no is actually a form of self-care.`; confidence 0.9; Option G about rudeness does not logically follow the preceding sentence on burnout; Option A directly contrasts with burnout and fits the flow.

### seven_select-sp-高考-fzigde
- Type: seven_select; exam: 高考; level: lv2
- Passage: Sleep is essential for our physical and mental health, yet many people struggle to get enough quality rest. (1) However, experts believe that small changes in our daily routine can
- Blank 5: current `2:If you wake up in the middle of the night, avoid checking the clock.` -> suggested `5:A comfortable mattress and pillow also contribute to better rest.`; confidence 0.9; Option C introduces an unrelated tip about waking up at night, breaking the flow of the final step about bedroom environment; Option F logically extends the list of sleep-friendly factors and leads naturally to the conclusion.

### seven_select-sp-高考-gy6rwb
- Type: seven_select; exam: 高考; level: lv2
- Passage: Life is full of unexpected twists and turns. Sometimes, we hold onto things that no longer serve us, simply because we are afraid of change. (1) However, learning to let go can be 
- Blank 4: current `4:By doing so, we free ourselves from the weight of the past.` -> suggested `2:Letting go of resentment opens the door to forgiveness and understanding.`; confidence 0.9; Blank 4 follows a sentence about holding onto past conflicts in friendships; Option C directly addresses resentment and forgiveness, while Option E is too generic and does not connect to the specific conflict.

### seven_select-sp-高考-h8kjui
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people struggle with saying no, especially when they want to be helpful or avoid disappointing others. (1) However, constantly saying yes can lead to burnout and resentment. L
- Blank 4: current `5:Once you start saying no, you will lose all your friends.` -> suggested `2:You don’t need to make up a long excuse to justify your decision.`; confidence 0.95; Option F contradicts the passage's positive tone about setting boundaries; Option C directly supports the advice to give a brief reason without over-explaining.

### seven_select-sp-高考-hf04j9
- Type: seven_select; exam: 高考; level: lv2
- Passage: Sleep is essential for our physical and mental health, yet many people struggle to get enough quality rest. (1) However, there are several effective strategies that can help improv
- Blank 4: current `0:Many people think that sleeping more on weekends can make up for lost sleep during the week.` -> suggested `5:For example, reading a book or listening to soft music can be helpful.`; confidence 0.9; Option A is about weekend catch-up sleep, unrelated to the context of making the sleep environment comfortable. Option F provides an example of relaxing activities, fitting the preceding sentence about creating a comfortable environment.

### seven_select-sp-高考-hy5oxx
- Type: seven_select; exam: 高考; level: lv2
- Passage: The Internet has become an essential part of our daily lives, offering convenience and endless information. However, it also brings risks such as identity theft and cyberbullying. 
- Blank 1: current `1:Therefore, it is important to take steps to protect yourself online.` -> suggested `0:Moreover, it is wise to update your passwords regularly and avoid using the same password for different accounts.`; confidence 0.85; Blank 1 follows a general warning and precedes 'First', so it should introduce the list. Option B is a general statement but does not logically lead into 'First' as a list item. Option A continues the idea of protection and naturally precedes the 'First' step.

### seven_select-sp-高考-kvw0rq
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where constant chatter and digital noise dominate our daily lives, silence is often undervalued. (1) However, silence can be a powerful tool in communication, allowing f
- Blank 1: current `3:Instead, they rush to fill every gap with words, fearing that silence might be seen as awkward.` -> suggested `0:Many people feel uncomfortable when there is a long pause in a conversation.`; confidence 0.9; Option D lacks a clear antecedent for 'they', while A directly introduces the common discomfort with silence, setting up the contrast with 'However'.

### seven_select-sp-高考-lu2nq3
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where everyone seems eager to speak, the art of listening is often undervalued. (1) Yet, listening is not just about hearing words; it is about understanding emotions an
- Blank 3: current `6:Research shows that we spend about 45% of our time listening, but we only remember 25% of what we hear.` -> suggested `2:C. Without listening, communication often breaks down quickly.`; confidence 0.85; The current key G is a general statistic that disrupts the logical flow from deepening trust to showing value; C provides a natural contrast to positive outcomes.

### seven_select-sp-高考-msk5nx
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, believing it to be a waste of time. (1) In fact, these brief exchanges can serve as the foundation for deeper relationships. (2) 
- Blank 1: current `1:These conversations often open doors to unexpected opportunities.` -> suggested `0:However, research shows that small talk plays a crucial role in building connections.`; confidence 0.9; The opening sentence presents a negative view; a contrast is needed, and A provides it, while B shifts topic.
- Blank 2: current `2:Without small talk, people may feel isolated even in crowded rooms.` -> suggested `1:These conversations often open doors to unexpected opportunities.`; confidence 0.85; After the weather example, B logically extends the idea; C introduces an unrelated negative consequence.
- Blank 3: current `4:In fact, these brief exchanges can serve as the foundation for deeper relationships.` -> suggested `2:Without small talk, people may feel isolated even in crowded rooms.`; confidence 0.8; Following 'Moreover, small talk helps create a sense of belonging', C provides a contrasting negative that reinforces the point; E repeats an earlier idea.
- Blank 4: current `3:Many find it difficult to start a conversation with strangers.` -> suggested `4:In fact, these brief exchanges can serve as the foundation for deeper relationships.`; confidence 0.85; After 'breaking the ice', E elaborates on the value; D introduces a difficulty not supported by the positive tone.
- Blank 5: current `6:Similarly, it can ease tension and make interactions more comfortable.` -> suggested `3:Many find it difficult to start a conversation with strangers.`; confidence 0.8; Before the conclusion, D presents a challenge that leads naturally to the importance of mastering small talk; G is a weak addition.

### seven_select-sp-高考-n9sv9y
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many successful people attribute their achievements to a well-structured morning routine. (1) Without a consistent start to the day, it’s easy to feel rushed and unproductive. Rese
- Blank 2: current `2:For instance, a 10-minute walk outside can boost creativity and mood.` -> suggested `1:Similarly, a consistent routine can help reduce anxiety and improve decision-making.`; confidence 0.85; The current option C repeats the example pattern already introduced, while B adds a new benefit and maintains coherence.
- Blank 5: current `1:Similarly, a consistent routine can help reduce anxiety and improve decision-making.` -> suggested `6:Once you establish a habit, it becomes easier to maintain over time.`; confidence 0.9; Option B introduces a new point that feels disconnected, while G provides a natural concluding remark about habit maintenance leading to the final sentence.

### seven_select-sp-高考-nm0a9u
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced world, communication often becomes a one-way street. Many people focus more on what they are going to say next than on truly hearing others. (1) This skill re
- Blank 1: current `0:Active listening is a skill that can be learned and improved with practice.` -> suggested `6:However, truly effective listening goes beyond simply hearing sounds.`; confidence 0.9; The passage opens by contrasting one-way communication with truly hearing others; G provides a logical contrast and introduces the concept of effective listening, leading into the definition of active listening. A is a generic statement that fits better later.
- Blank 5: current `6:However, truly effective listening goes beyond simply hearing sounds.` -> suggested `0:Active listening is a skill that can be learned and improved with practice.`; confidence 0.85; The paragraph concludes with the benefits of practicing active listening; A provides a natural concluding remark about learnability and practice, whereas G is an introductory contrast that belongs earlier.

### seven_select-sp-高考-o75xyw
- Type: seven_select; exam: 高考; level: lv2
- Passage: Do you often wake up feeling tired, even after a full night’s sleep? You are not alone. Many people struggle with poor sleep quality without knowing why. (1) In fact, the environme
- Blank 4: current `1:Once you develop these habits, your sleep quality will improve noticeably.` -> suggested `6:G. Thirdly, exercise regularly during the day to promote deeper sleep at night.`; confidence 0.85; The passage lists tips in sequence (first, secondly, also, finally); inserting a concluding sentence at blank 4 breaks the flow. A third tip about exercise fits logically before the final tip.
- Blank 5: current `4:Many people believe that sleep problems are caused by stress or diet.` -> suggested `1:B. Once you develop these habits, your sleep quality will improve noticeably.`; confidence 0.9; The passage ends with a concluding statement; the current sentence introduces an irrelevant new idea about stress/diet, disrupting the conclusion. The suggested sentence provides a natural wrap-up.

### seven_select-sp-高考-opp52v
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, it's easy to overlook the impact of small gestures. (1) However, research shows that even tiny acts of kindness can significantly boost both the giver's an
- Blank 1: current `2:However, research shows that even tiny acts of kindness can significantly boost both the giver's and receiver's happiness.` -> suggested `0:Many people think only grand gestures make a difference.`; confidence 0.95; The passage opens by noting it's easy to overlook small gestures, so a contrasting common misconception fits; the current key repeats the next sentence verbatim, creating redundancy.
- Blank 5: current `3:Some people argue that kindness is a sign of weakness.` -> suggested `6:Therefore, we should always wait for big opportunities to be kind.`; confidence 0.9; The final blank needs a concluding thought that contrasts with the positive evidence about small acts; option G provides that contrast, while option D introduces an unsupported argument.

### seven_select-sp-高考-p2t0kc
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often face requests that we would rather decline. However, many people find it difficult to say no, fearing they might disappoint others or damage relationsh
- Blank 3: current `4:This skill helps you focus on your own priorities and well-being.` -> suggested `1:However, the ability to say no can actually strengthen relationships.`; confidence 0.9; Option E is too generic and does not connect to the social context of agreeing to events; B offers a contrast that leads naturally to the warning about burnout.

### seven_select-sp-高考-pl87kk
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many successful people swear by their morning routines, and one practice that has gained significant popularity is writing 'morning pages.' This simple yet powerful habit involves 
- Blank 4: current `5:The content does not need to be polished or meaningful.` -> suggested `3:However, consistency is more important than perfection in this practice.`; confidence 0.8; Option F interrupts the flow of benefits; D better introduces advice for beginners.
- Blank 5: current `3:However, consistency is more important than perfection in this practice.` -> suggested `5:The content does not need to be polished or meaningful.`; confidence 0.8; Option F directly supports the instruction to write without stopping or judging.

### seven_select-sp-高考-po1isw
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, it's easy to overlook the impact of small gestures. (1) However, research shows that even tiny acts of kindness can significantly boost both the giver's an
- Blank 1: current `1:These small actions often go unnoticed in daily life.` -> suggested `0:Many people believe that grand gestures are the only way to make a difference.`; confidence 0.9; The 'However' contrast requires a preceding statement of a common belief that opposes the research finding; B merely restates the idea of being unnoticed, which does not create the needed contrast.
- Blank 4: current `5:Without such acts, society would become cold and indifferent.` -> suggested `4:It only takes a few seconds to make a positive impact on someone's life.`; confidence 0.85; F introduces a negative hypothetical that disrupts the positive explanatory flow; E maintains the practical, positive tone and leads naturally into the scientific evidence.

### seven_select-sp-高考-qft8ef
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced world, we are constantly surrounded by entertainment and information. From smartphones to streaming services, there is always something to keep us occupied. H
- Blank 2: current `3:However, constant stimulation can actually harm our ability to focus.` -> suggested `1:B. Many people fear boredom and try to avoid it at all costs.`; confidence 0.9; Option D shifts topic to constant stimulation, breaking the logical flow from boredom's benefits to examples; Option B introduces a contrast that fits the context.

### seven_select-sp-高考-r7zuc1
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. However, brief conversations about the weather or weekend plans can actually build social bonds. 
- Blank 4: current `0:People often feel lonely despite living in crowded cities.` -> suggested `6:However, not everyone is comfortable with initiating small talk.`; confidence 0.9; Current option A introduces an unrelated topic of loneliness, breaking the positive flow. Option G provides a logical contrast and leads naturally to the concluding encouragement.

### seven_select-sp-高考-ra6a9y
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that constantly demands our attention, learning to say “no” is an essential skill. (1) However, many people struggle with this simple word, fearing that it might damage 
- Blank 4: current `5:On the contrary, saying “yes” to everything often leads to burnout and resentment.` -> suggested `2:By saying “no” to unimportant tasks, you free up time for what really counts.`; confidence 0.9; Option F introduces an unnecessary contrast, while Option C directly continues the positive theme of focusing on what matters.
- Blank 5: current `2:By saying “no” to unimportant tasks, you free up time for what really counts.` -> suggested `5:On the contrary, saying “yes” to everything often leads to burnout and resentment.`; confidence 0.85; Option C is better placed at blank 4; Option F provides a fitting contrast before the concluding sentence, reinforcing the value of saying no.

### seven_select-sp-高考-siydko
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people struggle with saying no, especially when they want to be helpful. (1) However, constantly agreeing to everything can lead to burnout and resentment. Learning to say no 
- Blank 4: current `0:Many people feel guilty when they refuse a request.` -> suggested `1:Others may even take advantage of your constant willingness to help.`; confidence 0.85; The sentence before blank 4 discusses setting boundaries improving relationships; B provides a contrast about those who don't respect limits, while A (guilt) is less coherent here.

### seven_select-sp-高考-t49qmk
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often equates busyness with importance, learning to say no has become an essential skill for maintaining mental health and personal boundaries. (1) Many people find
- Blank 3: current `3:Nevertheless, many people fear that refusing will damage their relationships.` -> suggested `2:Therefore, it is crucial to practice saying no in a firm but kind manner.`; confidence 0.9; The current option introduces an unrelated contrast, while the suggested option logically follows the example and leads into the research.
- Blank 4: current `6:By doing so, you create more space for activities that align with your values.` -> suggested `4:The benefits of saying no extend beyond just reducing stress.`; confidence 0.85; The current option is vague; the suggested option naturally expands on the research about lower stress and satisfaction.
- Blank 5: current `4:The benefits of saying no extend beyond just reducing stress.` -> suggested `6:By doing so, you create more space for activities that align with your values.`; confidence 0.9; The current option is too general and redundant; the suggested option directly connects to the preceding sentence about priorities and the following sentence about saying yes to what matters.

### seven_select-sp-高考-ussxyt
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. However, brief conversations about weather or traffic can actually strengthen social bonds. (1) I
- Blank 5: current `5:Deep conversations are usually more meaningful than small talk.` -> suggested `1:People often feel awkward when starting a conversation.`; confidence 0.9; The passage consistently argues for the value of small talk; option F devalues it, breaking the positive flow. Option B provides a natural contrast leading to the concluding encouragement.

### seven_select-sp-高考-vj5psw
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today's fast-paced world, we are constantly surrounded by digital devices and endless entertainment. However, a growing number of psychologists argue that boredom might actually
- Blank 3: current `3:Many people try to escape boredom by scrolling through social media or watching videos.` -> suggested `6:By doing so, you might discover that boredom opens the door to fresh perspectives.`; confidence 0.9; Blank 3 follows an example about inventors and writers; the next sentence should conclude or reinforce the benefit of boredom, not introduce a contrasting escape behavior. Option G directly follows the example and leads naturally into the advice in blank 4.
- Blank 5: current `6:By doing so, you might discover that boredom opens the door to fresh perspectives.` -> suggested `3:Many people try to escape boredom by scrolling through social media or watching videos.`; confidence 0.85; Blank 5 is the final sentence before the concluding remark; it should contrast the common escape behavior with the advice to embrace boredom. Option D fits naturally as a contrastive statement before the final 'After all...' sentence.

### seven_select-sp-高考-vu2yed
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that achieving big goals requires dramatic changes. However, research in psychology suggests otherwise. (1) In fact, tiny adjustments in daily routines can lead
- Blank 1: current `0:Small habits are often overlooked because they seem insignificant at first.` -> suggested `4:This approach works because it lowers the barrier to starting.`; confidence 0.9; Option A is a general statement that does not logically follow the contrast introduced by 'However'; Option E directly explains why tiny adjustments work, linking to the next sentence.
- Blank 3: current `4:This approach works because it lowers the barrier to starting.` -> suggested `1:Starting with a tiny step reduces the fear of failure and increases consistency.`; confidence 0.85; Option E is redundant with the preceding sentence; Option B adds new information about fear and consistency, fitting better.
- Blank 5: current `5:Many people give up because they set unrealistic expectations.` -> suggested `3:Therefore, it is important to celebrate every small victory along the way.`; confidence 0.95; Option F is negative and does not fit the encouraging conclusion; Option G provides a positive recommendation that aligns with the preceding advice.

### seven_select-sp-高考-vu9eg9
- Type: seven_select; exam: 高考; level: lv2
- Passage: Happiness is a universal goal, yet its definition varies from person to person. (1) In recent years, researchers have identified several key factors that contribute to a lasting se
- Blank 4: current `5:Instead, we should learn to view difficulties as opportunities for growth.` -> suggested `3:D = "Moreover, even small acts like holding a door for a stranger can make a difference."`; confidence 0.9; Blank 4 follows the discussion of acts of kindness and 'helper's high'; D naturally extends that idea with a specific example, while F shifts to a different topic (viewing difficulties as opportunities) that belongs after the sentence about negative emotions.

### seven_select-sp-高考-w52wrw
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced society, we are constantly surrounded by sounds — traffic, notifications, chatter. Yet, truly listening has become a rare skill. (1) In fact, listening is not
- Blank 2: current `0:Many people mistake hearing for listening, but they are quite different.` -> suggested `1:Instead, we should resist the urge to respond immediately and focus on what is being said.`; confidence 0.9; Blank 2 follows the example of jumping in with advice; a corrective action fits better than a general distinction.
- Blank 3: current `1:Instead, we should resist the urge to respond immediately and focus on what is being said.` -> suggested `0:Many people mistake hearing for listening, but they are quite different.`; confidence 0.85; Blank 3 introduces the ability to pause; the distinction between hearing and listening serves as a logical lead-in.

### seven_select-sp-高考-wq2wu4
- Type: seven_select; exam: 高考; level: lv2
- Passage: Mistakes are often seen as something to avoid, but they can actually be valuable learning tools. (1) In fact, many great discoveries and inventions were born from errors. For examp
- Blank 2: current `3:Similarly, in daily life, errors can teach us important lessons about patience and persistence.` -> suggested `1:Instead of feeling ashamed, we should analyze what went wrong.`; confidence 0.9; Blank 2 follows a sentence about brain re-evaluating and strengthening problem-solving; the next logical step is to suggest a constructive response to mistakes, not a shift to daily life examples. Option B directly continues the advice on how to handle errors.
- Blank 3: current `1:Instead of feeling ashamed, we should analyze what went wrong.` -> suggested `3:Similarly, in daily life, errors can teach us important lessons about patience and persistence.`; confidence 0.85; Blank 3 is preceded by a sentence about students afraid of mistakes missing deeper understanding; the next sentence should contrast or expand on student attitudes. Option D ('Similarly, in daily life...') fits better as a generalizing follow-up, while B is more appropriate for blank 2.

### seven_select-sp-高考-xotdfc
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily conversations, we often focus on what to say, but sometimes what we don't say can be even more powerful. (1) It allows both sides to process thoughts and emotions more
- Blank 3: current `2:Silence can also inspire creativity.` -> suggested `5:F. Silence is often misunderstood in modern society.`; confidence 0.85; The paragraph contrasts positive cultural views of silence with a negative turn; Option C introduces an unsupported idea, while F provides a logical contrast.

### seven_select-sp-高考-ycicj7
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced world, many people spend hours sitting in meeting rooms, staring at screens. However, a growing number of companies are turning to a simple yet effective alte
- Blank 3: current `0:Walking meetings are especially useful for solving complex problems.` -> suggested `3:Participants often find it easier to express their thoughts freely.`; confidence 0.9; The preceding sentence directly leads to relaxed and open conversations, which D continues naturally; A introduces an unsupported claim about complex problems.

### seven_select-sp-高考-ydhl2w
- Type: seven_select; exam: 高考; level: lv2
- Passage: Learning to say no is a crucial skill in modern life, yet many people find it surprisingly difficult. (1) They fear disappointing others or damaging relationships. However, constan
- Blank 3: current `5:Instead of a flat refusal, offer an alternative or explain your situation.` -> suggested `6:The key is to be firm but polite, without over-explaining.`; confidence 0.9; The example sentence is a polite refusal without offering an alternative or explaining the situation in detail, so F does not fit; G matches better.

### seven_select-sp-高考-yknif9
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that happiness comes from wealth, fame, or success. However, research has shown that true happiness often lies in simple things. (1) For example, spending time 
- Blank 5: current `1:We should always set high goals for ourselves.` -> suggested `6:Money is often considered the key to happiness.`; confidence 0.9; The passage concludes by advising against chasing material things; option B introduces an unrelated idea about setting goals, while option G contrasts the common misconception about money, fitting the 'Therefore' conclusion better.

### seven_select-sp-高考-zazeh7
- Type: seven_select; exam: 高考; level: lv2
- Passage: Learning a new language is often seen as a difficult task, but it doesn't have to be that way. (1) In fact, the most effective way is to immerse yourself in the language as much as
- Blank 1: current `1:However, the key is to find a method that works for you.` -> suggested `0:Many people think that grammar is the most important part.`; confidence 0.9; The passage sets up a contrast with 'In fact', requiring a preceding common belief; option B introduces a new topic and does not logically lead to the immersion advice.
- Blank 5: current `5:Reading newspapers aloud can improve your pronunciation.` -> suggested `4:Instead, celebrate small achievements along the way.`; confidence 0.85; The marathon metaphor calls for pacing advice, not a specific technique; option E fits the concluding theme of patience and consistent effort.


## Ambiguous / Needs Human Review

### banked_cloze-bp-cet4-14d35ui
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `13:therapeutic`; suggested `13:`; 'therapeutic' fits grammatically and contextually, but other adjectives like 'destructive' could also fit with opposite meaning; not uniquely best.
- Blank 7: current `4:maturity`; suggested `1:`; 'maturity' and 'understanding' are both plausible as signs of silence in the workplace; current answer is acceptable but not uniquely correct.

### banked_cloze-bp-cet4-15t0z1l
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `1:ignorance`; suggested `8:weakness`; The context implies the child acts out of curiosity, but 'curiosity' is not an option. 'Ignorance' (lack of knowledge) can also explain touching a hot stove, so it is not clearly wrong. 'Weakness' is not a strong fit either. Both are possible, making the blank ambiguous.

### banked_cloze-bp-cet4-15t5jmy
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `1:thought`; suggested `5:presence`; Both 'deep thought' and 'deep presence' are plausible; the passage supports either interpretation.

### banked_cloze-bp-cet4-160akbr
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `10:stability`; suggested `10:stability`; 'Stability' is a noun and fits grammatically, but the collocation is weak; no clearly better option in the bank.

### banked_cloze-bp-cet4-19p9nis
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `5:recovery`; suggested `11:reduction`; 'Emotional recovery' is a common collocation and fits the context of self-reflection and finding peace; 'emotional reduction' is less natural. Both are possible, so the current key is not clearly wrong.

### banked_cloze-bp-cet4-1aoh8u7
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:conscious`; suggested `11:clear`; 'conscious break' is unusual but could be interpreted as a deliberate break; 'clear break' is more idiomatic but not the only possibility.

### banked_cloze-bp-cet4-1cnd53h
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `10:improve`; suggested `0:strengthen`; Both 'improve' and 'strengthen' are acceptable collocations with 'mental health'; context does not clearly favor one over the other.

### banked_cloze-bp-cet4-1cqu385
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `7:continuous`; suggested `0:basic`; 'continuous support' is acceptable in context (ongoing support), and 'basic support' is also plausible. Multiple options fit.

### banked_cloze-bp-cet4-1du0787
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `6:confuse`; suggested `13:confuse`; 'confuse' fits the structure 'confuse X with Y' but the intended meaning is 'associate' or 'equate'; no better option exists, so it is borderline acceptable.

### banked_cloze-bp-cet4-1e6faps
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `0:efficiently`; suggested `14:slowly`; 'efficiently' is a valid adverb; processing information more efficiently can also be a result of silence, so both fit.
- Blank 7: current `7:confuse`; suggested `8:avoid`; 'confuse it with loneliness or boredom' is grammatically and semantically plausible; it means mistakenly identifying silence as those feelings, which is a common reaction.

### banked_cloze-bp-cet4-1ew8qwv
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `5:emptiness`; suggested `6:confusion`; Both 'emptiness' and 'confusion' are plausible negative feelings that prompt device use; the current key is acceptable.

### banked_cloze-bp-cet4-1htzlf5
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `5:recharge`; suggested `6:balance`; 'recharge their creativity' is somewhat metaphorical but acceptable; 'balance' is also plausible. Both fit the context.

### banked_cloze-bp-cet4-1i7nygy
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 9: current `3:refocus`; suggested `8:recharge`; 'refocus' is already used in blank 3, but 'recharge our thoughts' is not a common collocation; 'reconnect' (index 7) is better, but 'refocus' is also acceptable here as it means to center thoughts. The current key is not clearly wrong.

### banked_cloze-bp-cet4-1k5467x
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `14:significant`; suggested `0:powerful`; Both 'significant state of awareness' and 'powerful state of awareness' are grammatically and semantically acceptable; 'significant' is not clearly wrong.

### banked_cloze-bp-cet4-1l68c2d
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `9:effective`; suggested `5:meaningful`; Both 'effective response' and 'meaningful response' are acceptable; neither is clearly wrong.

### banked_cloze-bp-cet4-1lyuvwr
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `6:massive`; suggested `10:complex`; 'massive actions' is acceptable in contrast to small habits; both 'massive' and 'complex' fit.

### banked_cloze-bp-cet4-1m74v0c
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 10: current `7:confused`; suggested `10:ignored`; 'confused with' can mean 'mistaken for', which is grammatically possible and semantically close; 'ignored' is also plausible but not clearly more correct.

### banked_cloze-bp-cet4-1m809lv
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 10: current `13:precious`; suggested `12:valuable`; Both 'precious' and 'valuable' are acceptable adjectives; 'valuable' is more common in this context, but 'precious' is not clearly wrong.

### banked_cloze-bp-cet4-1mjhbbr
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:pressure`; suggested `1:anxiety`; Both 'pressure' and 'anxiety' fit the context; 'pressure' is slightly more natural in negotiation.

### banked_cloze-bp-cet4-1nwl4ir
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `7:urgent`; suggested `9:ignored`; 'remains urgent' is grammatically correct and contextually plausible (the problem remains urgent because demand grows); 'remains ignored' also fits but is not clearly superior.

### banked_cloze-bp-cet4-1ojqovd
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `11:prevent`; suggested `2:reduce`; Both 'prevent' and 'reduce' are plausible; 'prevent' is slightly strong but acceptable, and the context does not clearly rule it out.

### banked_cloze-bp-cet4-1secwj6
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `14:enhance`; suggested `10:improve`; Both 'enhance' and 'improve' are acceptable collocations with 'mental health'.
- Blank 8: current `10:improve`; suggested `14:enhance`; Both 'improve' and 'enhance' work with 'concentration'.

### banked_cloze-bp-cet4-1u2ckm8
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `10:thought`; suggested `7:reflection`; 'Deeper thought' is acceptable, though 'deeper reflection' is a stronger collocation; both fit.

### banked_cloze-bp-cet4-1v5yf75
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `10:beneficial`; suggested `0:negative`; Both 'beneficial' and 'negative' are grammatically possible; the sentence 'not all procrastination is beneficial' is a natural lead-in to the distinction between active and passive procrastination, so the current key is acceptable.
- Blank 10: current `3:positive`; suggested `10:beneficial`; Both 'positive' and 'beneficial' are acceptable adjectives for 'tool'; 'positive tool' is a common collocation, and the current key is not clearly wrong.

### banked_cloze-bp-cet4-1xye193
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `0:eliminate`; suggested `5:destroy`; Both 'eliminate' and 'destroy' are semantically plausible; not clearly wrong.

### banked_cloze-bp-cet4-6d6zmz
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 10: current `3:lesson`; suggested `1:transformation`; 'lesson' is acceptable as a concluding moral, though 'transformation' echoes the opening theme; both are plausible.

### banked_cloze-bp-cet4-7m6p93
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `11:organized`; suggested `5:disciplined`; Both 'organized' and 'disciplined' are plausible adjectives for how students feel after making their beds.
- Blank 4: current `9:control`; suggested `4:momentum`; 'control' is acceptable, but 'momentum' aligns better with the theme of habit-building; both are grammatically correct.

### banked_cloze-bp-cet4-85ymg3
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `9:link`; suggested `12:break`; 'link' is acceptable; 'break' would change meaning and is less natural here.
- Blank 7: current `8:connection`; suggested `9:link`; 'connection' is acceptable; 'link' is also possible but not clearly more correct.

### banked_cloze-bp-cet4-aclnqz
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 9: current `2:accumulation`; suggested `13:constant`; 'accumulation' is a noun but collocation is poor; 'constant' as noun is rare and not fitting; no clearly correct option available

### banked_cloze-bp-cet4-auhu6j
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `12:adaptation`; suggested `2:presence`; 'Adaptation' can be interpreted as a trait evolved for survival, which fits the context of bioluminescence as an adaptive feature. 'Presence' is also plausible but not clearly superior. Both are acceptable.

### banked_cloze-bp-cet4-bsuqq6
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `4:benefit`; suggested `6:value`; 'benefit' can also be a noun meaning advantage, which fits the context of being overlooked; both 'benefit' and 'value' are plausible.

### banked_cloze-bp-cet4-eav1yg
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `12:productive`; suggested `2:valuable`; 'productive' fits grammatically and semantically; 'valuable' is also plausible but not clearly superior.

### banked_cloze-bp-cet4-gqc7c2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `10:valuing`; suggested `3:respect`; 'valuing' is a present participle parallel to 'listening', which is grammatically fine; both 'valuing' and 'respect' are semantically plausible, so the current key is acceptable.
- Blank 10: current `7:capture`; suggested `10:valuing`; 'capture the unspoken messages' is slightly unusual but not ungrammatical; 'valuing' is also plausible but not clearly superior. Multiple options fit.

### banked_cloze-bp-cet4-he0pdi
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `5:approach`; suggested `1:method`; Both 'approach' and 'method' are acceptable; 'method' is slightly more precise but not clearly wrong.

### banked_cloze-bp-cet4-jb65ft
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 10: current `3:ignore`; suggested `1:underestimate`; Both 'ignore' and 'underestimate' are possible, but 'underestimate the power' is a stronger collocation and more consistent with the passage's theme.

### banked_cloze-bp-cet4-k6owls
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `14:serious`; suggested `2:negative`; Both 'serious problem' and 'negative problem' are acceptable; 'serious' is a common collocation and fits the context.

### banked_cloze-bp-cet4-k9o4sb
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `3:mindfulness`; suggested `13:effort`; 'practice mindfulness' is a common phrase and fits the description; 'practice effort' is less natural. Both are possible.

### banked_cloze-bp-cet4-kneb7h
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `0:interrupted`; suggested `3:distracted`; Both 'interrupted' and 'distracted' are possible; 'interrupted' is acceptable though 'distracted' may be more natural.

### banked_cloze-bp-cet4-l4udoz
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `10:trivial`; suggested `7:ordinary`; 'trivial' can mean 'of little value', but the context 'seem trivial' is idiomatic and acceptable; 'ordinary' is also plausible but not clearly more correct.
- Blank 8: current `7:ordinary`; suggested `10:trivial`; 'ordinary acts' is a natural collocation and fits the contrast with 'grand occasions'; 'trivial' is also possible but not clearly superior.

### banked_cloze-bp-cet4-lxi6sl
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 10: current `12:resilience`; suggested `14:regulation`; Both 'resilience' and 'regulation' are nouns; 'emotional resilience' is also a common collocation, making the current key acceptable.

### banked_cloze-bp-cet4-oc0grf
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `2:dramatic`; suggested `3:significant`; 'dramatic event' is acceptable; the passage does not explicitly preclude sudden breakthroughs, and 'dramatic' fits the contrast with gradual habits.

### banked_cloze-bp-cet4-t123f2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `3:enhance`; suggested `2:promote`; Both 'enhance' and 'promote' collocate with 'mental health'; 'enhance' is acceptable.
- Blank 5: current `6:tolerate`; suggested `0:ignore`; 'Tolerate with silence' is awkward but 'tolerate silence' is possible; no perfect option exists.
- Blank 7: current `13:establish`; suggested `2:promote`; Both 'establish' and 'promote' are plausible for silent rooms.
- Blank 8: current `2:promote`; suggested `13:establish`; Both 'promote' and 'establish' fit; 'establish' is more direct but 'promote' is acceptable.

### banked_cloze-bp-cet4-v35ol
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `8:value`; suggested `7:peace`; 'value of silence' is grammatically correct and idiomatic; 'peace of silence' is also plausible but not clearly superior. Both fit the context.
- Blank 10: current `7:peace`; suggested `9:relaxation`; 'sense of peace' is a common collocation and fits the context of stress reduction; 'relaxation' is also possible but not clearly more correct. Both are acceptable.

### banked_cloze-bp-cet4-w2yyp2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 10: current `7:environmental`; suggested `3:rewarding`; 'environmental' can be interpreted as an adjective describing the type of rewards (e.g., environmental benefits), and the parallel structure 'personal and environmental' is grammatically acceptable; 'rewarding' is also plausible but not clearly more correct.

### banked_cloze-bp-cet4-wcckm1
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `10:valued`; suggested `12:ignored`; 'Valued' can be used neutrally or ironically in context; 'silence is often valued as a negative element' is grammatically acceptable and not clearly wrong.

### banked_cloze-bp-cet4-y9j5ra
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `10:happiness`; suggested `11:trust`; 'happiness' is acceptable as a result of small talk; 'trust' also fits but not clearly more correct.

### banked_cloze-bp-cet4-ydcsjn
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `10:feature`; suggested `12:creative`; 'feature' can be interpreted as a characteristic or aspect of urban gardening, which fits the context; 'creative' is also plausible but not clearly more correct.

### banked_cloze-bp-cet4-yzfov2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:effective`; suggested `2:reliable`; Both 'effective' and 'reliable' are acceptable; 'surprisingly effective' is a common collocation and fits the context of micro-habits being surprisingly good at producing results.
- Blank 10: current `2:reliable`; suggested `7:effective`; Both 'reliable' and 'effective' are plausible; 'reliable tool' is a natural collocation and the passage emphasizes consistency, so the current key is acceptable.

### banked_cloze-bp-cet4-z6cfo
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `10:trust`; suggested `10:trust`; Both 'build trust' and 'build connection' are plausible; the passage supports either, so the current key is not clearly wrong.

### banked_cloze-bp-cet6-12na6oi
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `7:reinforce`; suggested `10:widen`; 'reinforce' can mean to strengthen existing divides, which fits the contrast with 'bridge'; 'widen' is also plausible but not clearly more correct.

### banked_cloze-bp-cet6-13cptaw
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `7:neglect`; suggested `0:overlooked`; 'neglect' is grammatically possible and semantically close; both 'neglect' and 'overlook' can fit, though 'overlook' is more precise for ignoring benefits.
- Blank 8: current `9:success`; suggested `1:initiative`; 'success' is acceptable; 'initiative' is also plausible. Both fit the context of depending on public awareness and political will.

### banked_cloze-bp-cet6-13outwr
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 7: current `13:indicate`; suggested `7:emphasized`; 'Indicate' is grammatically correct and semantically plausible; 'emphasized' is also possible but not clearly superior.

### banked_cloze-bp-cet6-152roc0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `0:contest`; suggested `1:constant`; The blank requires a verb; 'contest' is grammatically possible but semantically odd. 'Constant' is an adjective and cannot fill the verb slot. No ideal option exists.

### banked_cloze-bp-cet6-15uxc5l
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `2:cost`; suggested `12:suffer`; 'cost of professional isolation' is acceptable as a noun phrase meaning the price or downside; 'suffer' would require a different structure (e.g., 'suffer from'). The current key is not clearly wrong.

### banked_cloze-bp-cet6-166458o
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 4: current `9:integrates`; suggested `12:combines`; Both 'integrates' and 'combines' are grammatically correct and semantically plausible; 'combines' is more common but not exclusively correct.
- Blank 5: current `10:resilient`; suggested `5:reliable`; 'Resilient against hacking attempts' is acceptable; 'reliable' is also plausible but not clearly superior.

### banked_cloze-bp-cet6-16x645e
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `7:simplicity`; suggested `7:simplicity`; The passage discusses reducing screen time and engaging natural abilities; 'simplicity' can be interpreted as a lifestyle of reduced complexity, which aligns with digital minimalism. The suggested alternative is the same word, and no clearly better option exists in the bank.

### banked_cloze-bp-cet6-16y5vqh
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 8: current `4:master`; suggested `0:cultivate`; 'master' can mean gain control over, which fits; 'cultivate' is more natural with 'balance'. Both acceptable.

### banked_cloze-bp-cet6-18n1jjt
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `8:compelling`; suggested `7:resist`; The structure 'find it [adj] to do' requires an adjective; 'compelling' is an adjective but does not fit the intended meaning of difficulty. However, no ideal adjective is available, and 'compelling' could be interpreted as 'forceful' in a stretched sense. The suggested 'resist' is a verb and does not fit the grammatical pattern. Thus the blank is ambiguous.
- Blank 4: current `2:tempt`; suggested `0:introduce`; 'Tempt users with a sense of belonging' is slightly unidiomatic but not clearly wrong; 'tempt' can be used with 'with' in some contexts. 'Introduce' also does not form a perfect collocation. Both are possible, making the blank ambiguous.
- Blank 10: current `3:hazards`; suggested `1:abundance`; 'Hazards' is grammatically correct and contextually plausible, but 'abundance' also fits the idea of excessive engagement. Both are reasonable, so the blank is ambiguous.

### banked_cloze-bp-cet6-19j1m0u
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `3:clear`; suggested `9:rigid`; 'clear boundaries' is grammatically and semantically acceptable; 'rigid' is also possible but not clearly superior.

### banked_cloze-bp-cet6-1btp2m4
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `3:cultivating`; suggested `10:foster`; Both 'cultivating self-compassion' and 'fostering self-compassion' are acceptable; 'foster' is more common in psychological contexts

### banked_cloze-bp-cet6-1d3ne67
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 4: current `9:presence`; suggested `4:prevalence`; 'presence of bias' is grammatically acceptable, but 'prevalence' is more precise for widespread bias; both are possible.

### banked_cloze-bp-cet6-1d4umg2
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `2:promotes`; suggested `2:`; Both 'promotes' and 'complicates' are logically plausible; the context does not clearly favor one over the other.

### banked_cloze-bp-cet6-1f2pl85
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `14:overrated`; suggested `5:scarcity`; 'overrated' is semantically odd but not clearly ungrammatical; no option fits perfectly, so ambiguous.

### banked_cloze-bp-cet6-1ixyy0b
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `0:discard`; suggested `6:eliminate`; 'discard the value' is marginally acceptable but 'eliminate' is a more precise collocation; both are possible.
- Blank 10: current `5:discernment`; suggested `3:wisdom`; 'with greater discernment' is acceptable, but 'with greater wisdom' is a more common collocation; both fit the meaning of careful judgment.

### banked_cloze-bp-cet6-1j637du
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `1:advancement`; suggested `12:implementation`; 'Advancement of digital literacy' is acceptable as progress or development; 'implementation' also fits but is not clearly superior.

### banked_cloze-bp-cet6-1jzx21x
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `10:tangible`; suggested `0:inherent`; Both 'tangible effects' and 'inherent effects' are plausible; 'tangible' is acceptable as concrete physical effects.
- Blank 10: current `1:genuine`; suggested `0:inherent`; 'Genuine health and happiness' is acceptable; 'inherent' also fits but not clearly superior.

### banked_cloze-bp-cet6-1lcyqvs
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `4:attention`; suggested `9:paradox`; 'gained considerable attention' is grammatically correct and contextually plausible; 'paradox' is also possible but not clearly superior.

### banked_cloze-bp-cet6-1nv5sy0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `10:focused`; suggested `2:balanced`; 'focused state of mind' is acceptable and not ungrammatical; both 'focused' and 'balanced' are plausible in context.
- Blank 5: current `1:fragmented`; suggested `11:isolating`; 'fragmented nature of modern communication' is a common and acceptable phrase; both 'fragmented' and 'isolating' fit the context, with 'fragmented' emphasizing disjointedness and 'isolating' emphasizing loneliness.

### banked_cloze-bp-cet6-1qgdu3n
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 8: current `12:evaluating`; suggested `0:assess`; Both 'evaluating' (gerund) and 'assess' (bare infinitive) are grammatically acceptable after 'carefully' in the parallel structure; neither is clearly wrong.

### banked_cloze-bp-cet6-1rtl9u9
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `9:ambiguity`; suggested `11:burden`; Both 'legal ambiguity' and 'legal burden' are plausible; context supports either.

### banked_cloze-bp-cet6-1sa02t9
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `12:optimize`; suggested `5:replicate`; 'optimize repetitive tasks' is acceptable but 'replicate' is more natural for performing tasks; both fit grammatically.
- Blank 6: current `14:limitation`; suggested `10:obstacle`; 'This limitation' fits, but 'This obstacle' is also plausible; both refer to the problem described.

### banked_cloze-bp-cet6-1sovzt1
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `3:compelling`; suggested `6:excessive`; 'compelling sense of anxiety' is unusual but not ungrammatical; 'excessive' is also plausible, making both acceptable.

### banked_cloze-bp-cet6-1u733e4
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `1:strike`; suggested `13:enhance`; 'strike a balance' is a fixed collocation and fits; 'enhance a balance' is less common but possible. Both are acceptable.

### banked_cloze-bp-cet6-1uudhgo
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `8:rigorous`; suggested `6:temporary`; Both 'rigorous' and 'temporary' are plausible; 'rigorous' fits the discipline required, 'temporary' fits the specific-hours context.

### banked_cloze-bp-cet6-1v8bign
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `10:haunted`; suggested `11:paradox`; 'haunted' is a past participle and can collocate with 'by a paradox' in literary English, though not ideal; 'paradox' is a noun and does not fit the grammatical structure. The blank requires a past participle, and 'haunted' is the only candidate among the options. Thus, the current key is acceptable, though not perfect.

### banked_cloze-bp-cet6-2xqqt6
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `12:transient`; suggested `13:superficial`; 'transient' (temporary) is plausible because benefits may be short-lived without strategy; 'superficial' (shallow) also fits. Both are acceptable.

### banked_cloze-bp-cet6-4fc191
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `6:yield`; suggested `4:value`; 'yield meaning' is acceptable though less common; no clearly correct alternative in bank.

### banked_cloze-bp-cet6-7agls2
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 7: current `14:reliant`; suggested `12:addicted`; Both 'reliant on' and 'addicted to' are grammatically possible; 'addicted' is stronger but 'reliant' is not clearly wrong.

### banked_cloze-bp-cet6-83l5o4
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `10:aspire`; suggested `10:aspire`; 'aspire to unplug' is grammatically correct and semantically plausible, though not ideal; no clearly better option exists.

### banked_cloze-bp-cet6-blqr9w
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `2:restore`; suggested `14:foster`; 'restore a sense of control' is acceptable if control was previously lost; both 'restore' and 'foster' are plausible.

### banked_cloze-bp-cet6-c55pul
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `14:mitigate`; suggested `1:reduce`; Both 'mitigate' and 'reduce' are acceptable; 'reduce' is more common but 'mitigate' is not wrong.

### banked_cloze-bp-cet6-ccyxdw
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `1:provoke`; suggested `2:generate`; Both 'provoke' and 'generate' collocate with 'psychological responses'; 'provoke' is slightly more negative but acceptable.
- Blank 5: current `2:generate`; suggested `1:provoke`; Both 'generate excitement' and 'provoke excitement' are acceptable; no clear error.

### banked_cloze-bp-cet6-fdg57b
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `2:vulnerability`; suggested `7:fragility`; 'vulnerability of data privacy' is acceptable and commonly used; 'fragility' is also possible but not clearly more correct.

### banked_cloze-bp-cet6-fnzn4h
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `11:underestimated`; suggested `2:overlooked`; Both 'underestimated' and 'overlooked' are grammatically and semantically acceptable; 'overlooked' is slightly more natural but not clearly superior.
- Blank 5: current `9:dilemma`; suggested `5:paradox`; Both 'dilemma' and 'paradox' fit the context; 'paradox' may better capture the contradictory nature, but 'dilemma' is also plausible.

### banked_cloze-bp-cet6-h3xw34
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `10:presence`; suggested `6:imbalanced`; 'presence of biased data' is grammatically and semantically acceptable; 'imbalanced' is also plausible but not clearly superior in this context.

### banked_cloze-bp-cet6-id0vi
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 8: current `5:texture`; suggested `13:fabric`; 'texture of lived experience' is acceptable, though 'fabric' is a more common collocation; both are possible.

### banked_cloze-bp-cet6-ieu49r
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `7:limited`; suggested `13:assumed`; 'Limited' is an adjective, but 'have limited' could be past participle verb; however, 'have assumed' fits better semantically.

### banked_cloze-bp-cet6-ifo4q0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `10:restore`; suggested `12:enhance`; 'restore' can imply returning to a natural state of mental clarity, which is plausible in a context of reducing digital overload; 'enhance' is also valid but not clearly superior.

### banked_cloze-bp-cet6-j07w1s
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 4: current `1:fear`; suggested `12:worry`; Both 'fear' and 'worry' are grammatically correct and contextually plausible; 'worry' is slightly more natural but not clearly superior.
- Blank 6: current `0:accountability`; suggested `6:fairness`; 'Accountability' is a valid noun parallel to 'fairness', though 'fairness' would be redundant; the current key is acceptable.

### banked_cloze-bp-cet6-j2o1mh
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 4: current `9:pledge`; suggested `1:voluntarily`; 'pledge to use' is grammatically correct and can fit the context of making a commitment; 'voluntarily' would require a different verb structure. Both are possible.

### banked_cloze-bp-cet6-j68n7f
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `4:burst`; suggested `4:burst`; 'a burst of anxiety' is acceptable, though 'sense' or 'feeling' would be more precise; no better option in the bank, so the current key is not clearly wrong.

### banked_cloze-bp-cet6-jqunmu
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `12:price`; suggested `13:costs`; Both 'price' (singular, metaphorical) and 'costs' (plural, literal) are acceptable; 'costs' is more natural for programs but 'price' is not wrong.

### banked_cloze-bp-cet6-mbcf6n
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `10:strict`; suggested `2:relaxed`; Both 'strict' and 'relaxed' could fit: 'strict boundaries' is a common collocation and the passage contrasts total abstinence with mindful boundaries, but 'strict' could imply clear, firm limits, which aligns with 'designating tech-free hours or zones'.

### banked_cloze-bp-cet6-mcvz40
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `11:deliberately`; suggested `5:excessive`; 'Deliberately reducing' is grammatically and semantically acceptable; the passage does not require an adjective before 'screen time'. Both options are plausible.

### banked_cloze-bp-cet6-n60rgv
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `5:challenge`; suggested `13:necessity`; Both 'technical challenge' and 'technical necessity' fit the context; neither is clearly wrong or clearly correct.

### banked_cloze-bp-cet6-ng1zcd
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `6:merits`; suggested `14:impacts`; Both 'merits' and 'impacts' are grammatically possible; 'impacts' pairs better with 'costs'.

### banked_cloze-bp-cet6-oj0k7s
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 7: current `14:enthusiasm`; suggested `14:enthusiasm`; The context allows 'enthusiasm' as a plausible noun for a short-lived phenomenon, and no clearly better option is available in the bank.

### banked_cloze-bp-cet6-qvmnje
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `5:attention`; suggested `11:prevalence`; 'gained considerable attention' is a common and natural collocation; the context does not clearly require 'prevalence' over 'attention'.

### banked_cloze-bp-cet6-s53nw9
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 7: current `5:capacity`; suggested `13:sustainable`; 'capacity' as a noun meaning ability can work with 'better capacity in managing', but 'sustainable' as an adjective modifying 'use' is also plausible; both are possible.

### banked_cloze-bp-cet6-t3ysmy
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 8: current `8:scalability`; suggested `0:support`; 'scalability' is possible but less natural; 'support' is a more common collocation with 'long-term financial commitment'.

### banked_cloze-bp-cet6-urn9kj
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `6:prosperity`; suggested `7:adopt`; 'prosperity' is grammatically a noun but semantically positive, while the context requires a negative or neutral noun like 'adoption' or 'impact'; however, 'adoption' is used later, and 'opaque' is an adjective, so the current key is not clearly wrong—multiple interpretations exist.

### banked_cloze-bp-cet6-w3i3c2
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `14:confront`; suggested `12:enhance`; 'confront users with content' is unusual but can be interpreted as 'present users with content in a challenging way'; 'enhance' is also not ideal. Other options like 'counter' or 'reinforce' are possible with context shifts. The current key is not clearly wrong.

### banked_cloze-bp-cet6-wm8zs0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `3:escape`; suggested `6:abstinence`; 'periods of escape from technology' is acceptable; 'abstinence' is more precise but not clearly required
- Blank 8: current `6:abstinence`; suggested `3:escape`; 'sudden abstinence' is a valid collocation; 'sudden escape' is also possible but not clearly better

### banked_cloze-bp-cet6-xijkh0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `11:badge`; suggested `10:symbol`; Both 'badge' and 'symbol' are possible; 'symbol' is more formal but 'badge' is a known phrase.

### banked_cloze-bp-cet6-xn3psd
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `9:paradox`; suggested `2:dilemma`; Both 'paradox' and 'dilemma' can describe the contradictory situation; 'paradox' is also acceptable here.
- Blank 6: current `8:reinforce`; suggested `3:enhanced`; 'Reinforce' can mean to strengthen boundaries, which is also plausible; both are acceptable.

### banked_cloze-bp-cet6-y5915z
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `9:deliberate`; suggested `12:excessive`; Both 'deliberate reduction' and 'excessive reduction' are grammatically and semantically plausible; the context does not clearly favor one over the other.
- Blank 6: current `14:persistent`; suggested `12:excessive`; Both 'persistent distraction' and 'excessive distraction' are acceptable; the passage does not strongly disambiguate.

### banked_cloze-bp-cet6-ybzmg3
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `5:inseparable`; suggested `9:invisible`; 'inseparable extension' is somewhat idiomatic; 'invisible' is also plausible but not clearly superior.

### banked_cloze-bp-cet6-zmnl01
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 8: current `13:unavoidable`; suggested `3:trivial`; Both 'unavoidable' and 'trivial' are grammatically and contextually plausible; the current key is not clearly wrong.

### seven_select-sp-kaoyan-11589wz
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 1: current `1:Digital technologies have made it easier for anyone to publish and distribute content online.`; suggested `5:The traditional gatekeeping role of journals is therefore being steadily eroded.`; Both B and F can fit; B introduces the digital shift generally, while F concludes the erosion of gatekeeping; the context allows either.
- Blank 4: current `5:The traditional gatekeeping role of journals is therefore being steadily eroded.`; suggested `1:Digital technologies have made it easier for anyone to publish and distribute content online.`; F is a plausible conclusion after discussing preprints, but B also fits as a general statement about digital ease; both are acceptable.

### seven_select-sp-kaoyan-1242wky
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `5:This perspective, however, overlooks the fact that not everyone can afford to opt out of the digital economy.`; suggested `3:D. Many people find it impossible to maintain a balanced digital diet without external support.`; Option F is not clearly wrong; it can serve as a transitional reminder of privilege before the call for collective action, and the passage's flow allows for either F or D.

### seven_select-sp-kaoyan-12e4w1y
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `4:Critics also point out that algorithmic systems lack the empathy needed for nuanced human contexts.`; suggested `1:Without proper oversight, these feedback loops can escalate into serious social harms.`; Option B directly references 'feedback loops' from the policing example and escalates the point, creating tighter coherence; however, Option E is also acceptable as a general criticism, making the choice ambiguous.

### seven_select-sp-kaoyan-12resji
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `4:Yet, without deliberate boundaries, the very tools designed to liberate us can become instruments of mental enslavement.`; suggested `2:These policies, though promising, face resistance from traditional management cultures that equate visibility with productivity.`; Both E and C are acceptable; E is a general warning fitting the conclusion, C transitions from policy discussion to final challenge.

### seven_select-sp-kaoyan-131dngz
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `4:This phenomenon, often termed the 'paradox of choice', has profound implications for how businesses design their product offerings.`; suggested `2:C. Consequently, many consumers now actively seek out brands that offer streamlined product lines.`; The current E defines the paradox, which logically follows the jam example; C is also plausible as a consequence, but E is not clearly wrong.
- Blank 4: current `3:To illustrate, a well-known electronics retailer discovered that reducing the number of models on display increased sales by 15%.`; suggested `4:E. This phenomenon, often termed the 'paradox of choice', has profound implications for how businesses design their product offerings.`; Current D provides an illustration that fits after the general statement; E could also work as a transition, but D is not ungrammatical or clearly wrong.
- Blank 5: current `2:Consequently, many consumers now actively seek out brands that offer streamlined product lines.`; suggested `3:D. To illustrate, a well-known electronics retailer discovered that reducing the number of models on display increased sales by 15%.`; Current C is a logical consequence of the preceding strategies; D could also serve as an example, but C is acceptable and not clearly wrong.

### seven_select-sp-kaoyan-13atfbm
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `2:The benefits of urban parks are widely recognized by city governments around the world.`; suggested `1:Green spaces have been proven to reduce air pollution and lower temperatures in cities.`; The passage ends with a conclusion; no insertion is clearly needed. Both C and B are somewhat out of place, but C is not clearly wrong.

### seven_select-sp-kaoyan-13xjbjd
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `5:These findings challenge the assumption that more screen time necessarily leads to greater productivity.`; suggested `5:`; Option F is coherent with the preceding research, but Option E could also fit as it follows the mention of benefits and leads into personalized balance.

### seven_select-sp-kaoyan-14mq310
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `4:This phenomenon is particularly pronounced among professionals who rely on digital tools for work.`; suggested `3:Without the constant buzz of notifications, many find themselves grappling with a sense of emptiness.`; Both E and D could fit after the example of isolation; not uniquely best.

### seven_select-sp-kaoyan-14u2sjz
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `0:Smartphones and social media platforms are engineered to exploit our psychological vulnerabilities, making it harder to resist their pull.`; suggested `5:These findings challenge the long-held assumption that multitasking is an efficient way to handle modern workloads.`; Option F directly follows the Stanford study with 'these findings', but Option A is also acceptable as a general statement; both fit.

### seven_select-sp-kaoyan-15228fj
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `5:These initiatives, however, remain the exception rather than the rule.`; suggested `4:Moreover, the stigma attached to failure can lead researchers to hide or manipulate unfavorable data.`; Option F refers to 'initiatives' that are only introduced in the next sentence, making it slightly awkward but not clearly wrong; option E about stigma could also fit as a consequence of the funding problem. Both are plausible.

### seven_select-sp-kaoyan-152kvhv
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `2:The key lies in aligning technology use with personal values rather than letting algorithms dictate our choices.`; suggested `5:Critics also point out that digital minimalism may exacerbate existing inequalities, as not everyone can afford to disconnect.`; Both Option C and Option F could fit; C works as a concluding remark, F as an additional criticism before the conclusion.

### seven_select-sp-kaoyan-15qwb1x
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `0:Many people find it difficult to disconnect from their devices even during vacations.`; suggested `4:Adopting such a lifestyle requires a deliberate evaluation of one's digital habits.`; Option A is acceptable but generic; Option E ties more directly to the preceding discussion of boundaries and leads to the conclusion. Both are plausible.

Additional ambiguous rows omitted from Markdown: 250. See JSON report.

## Shape Issues

- banked_cloze-bp-cet4-115fefh: bank contains duplicate option text
- banked_cloze-bp-cet4-1cfg1to: bank contains duplicate option text
- banked_cloze-bp-cet4-1w80xl3: bank contains duplicate option text
- banked_cloze-bp-cet4-brudvn: bank contains duplicate option text
- banked_cloze-bp-cet4-j80iyv: bank contains duplicate option text
- banked_cloze-bp-cet4-n9pfc8: bank contains duplicate option text
- banked_cloze-bp-cet4-qfelda: bank contains duplicate option text
- banked_cloze-bp-cet6-1bzxs2i: bank contains duplicate option text
- banked_cloze-bp-cet6-fgqi7e: bank contains duplicate option text

## AI Errors

No AI/API errors.

## Notes

- Confirmed wrong requires two passes: pass 1 flags a blank, pass 2 confirms it.
- Ambiguous means the item should be reviewed by a human before changing the answer key.
- The script intentionally does not modify Supabase.
