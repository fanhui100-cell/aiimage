# Passage Answer Key Audit

Generated: 2026-06-17T22:00:57.087Z

Scope: active `banked_cloze` and `seven_select` rows. This report is read-only; no database rows were changed.

## Summary

| Type | Rows | Shape issue rows | Confirmed wrong rows | Confirmed wrong blanks | Ambiguous rows | AI error rows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| banked_cloze | 223 | 0 | 6 | 8 | 38 | 0 |
| seven_select | 186 | 0 | 16 | 24 | 49 | 0 |

## Confirmed Wrong

### banked_cloze-bp-cet4-l4udoz
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In our fast-paced world, it is easy to overlook the (1) of small acts of kindness. However, research shows that even a brief moment of attention can (2) someone’s entire day. A sim
- Blank 3: current `10:trivial` -> suggested `7:ordinary`; confidence 0.85; 'trivial' has a negative connotation that contradicts the passage's emphasis on meaningful impact; 'ordinary' fits the contrast and tone.

### banked_cloze-bp-cet4-t123f2
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, the value of silence is often (1). Yet, recent studies have shown that moments of quiet can (2) our mental health in significant ways. When w
- Blank 5: current `6:tolerate` -> suggested `0:ignore`; confidence 0.7; 'Tolerate with silence' is ungrammatical; 'ignore' fits the structure 'ignore with silence'? No, but 'tolerate' is wrong; no correct option fits perfectly, but 'ignore' is closer to the intended meaning of avoiding silence.

### banked_cloze-bp-cet6-15uxc5l
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The shift to remote work, once hailed as a liberating trend, has now revealed a less visible downside: the (1) of professional isolation. While employees enjoy flexibility, many re
- Blank 1: current `2:cost` -> suggested `12:suffer`; confidence 0.9; 'cost of professional isolation' is unidiomatic; 'suffer from professional isolation' fits the context of experiencing a downside

### banked_cloze-bp-cet6-85u4gu
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that (1) the use of technology to only essential functions. Proponents argue that reducing
- Blank 1: current `8:minimizes` -> suggested `6:maximizes`; confidence 0.95; 'Minimizes the use of technology to only essential functions' is contradictory; 'maximizes' fits the context of limiting use to essentials.
- Blank 6: current `3:efficiency` -> suggested `2:productivity`; confidence 0.9; 'Efficiency of digital tools' does not logically enhance productivity; the intended meaning is that mindful use enhances productivity, so 'productivity' is correct.

### banked_cloze-bp-cet6-ifo4q0
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where digital devices (1) our daily lives, a growing number of people are embracing the concept of digital minimalism. This movement advocates for a deliberate reduction 
- Blank 2: current `10:restore` -> suggested `12:enhance`; confidence 0.85; 'restore' implies returning to a previous state, but the context is about achieving mental clarity, not regaining it; 'enhance' fits better.

### banked_cloze-bp-cet6-l17dgn
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital communication has become (1) , we find ourselves more connected yet more isolated than ever. The (2) of social media platforms promises instant interaction,
- Blank 5: current `8:worrying` -> suggested `2:persistent`; confidence 0.85; 'worrying' as an adjective meaning causing worry does not fit the context of a gradual decline; 'persistent' better describes an ongoing shift.
- Blank 8: current `2:persistent` -> suggested `8:worrying`; confidence 0.8; 'persistent anxiety' is acceptable but the context of constant online validation leading to anxiety that causes worry makes 'worrying anxiety' more precise and idiomatic; the swap is incorrect.

### seven_select-sp-kaoyan-148jnzu
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones and social media dominate daily life, the concept of digital detox has gained considerable traction. (1) However, this constant connectivity comes with 
- Blank 3: current `6:These findings challenge the popular assumption that multitasking is an efficient way to handle information.` -> suggested `2:This fragmented attention not only hampers productivity but also impairs memory consolidation.`; confidence 0.9; Blank 3 follows a specific study example; 'These findings' lacks a clear antecedent, while option C directly continues the topic of fragmented attention from blank 2.

### seven_select-sp-kaoyan-1s2ubmg
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices permeate every aspect of daily life, a growing number of individuals are embracing digital minimalism as a conscious lifestyle choice. (1) This phil
- Blank 5: current `4:Social media platforms, by contrast, are designed to exploit psychological vulnerabilities for profit.` -> suggested `5:Without careful implementation, the movement risks becoming a privilege of the affluent.`; confidence 0.9; Option E introduces a new topic about social media design, while the preceding sentence discusses critics' concern about the digital divide; Option F directly continues that concern.

### seven_select-sp-kaoyan-1v2bbjc
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a countermeasure to the overwhelming presence of technology in daily life. (1) However, a less discussed aspect is the ps
- Blank 5: current `3:Some people find it easier to quit social media cold turkey than to moderate their usage gradually.` -> suggested `6:Instead, a more nuanced strategy that respects individual circumstances is needed.`; confidence 0.9; Option D introduces a new, unrelated point about quitting methods, disrupting the logical flow toward the conclusion about intentional engagement; option G provides the necessary transition.

### seven_select-sp-kaoyan-1xuhm5q
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a lifestyle choice aimed at reducing screen time and reclaiming real-world interactions. (1) However, a growing body of r
- Blank 3: current `3:The phenomenon has been particularly pronounced among young adults who grew up with ubiquitous internet access.` -> suggested `1:B. Some studies indicate that moderate use of social media can actually boost creativity and problem-solving skills.`; confidence 0.85; Option D introduces a demographic detail that disrupts the logical flow from weak ties to further benefits; B continues the positive role of digital platforms more coherently.

### seven_select-sp-kaoyan-20pp9m
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices pervade every aspect of our lives, a growing number of individuals are embracing a countercultural movement known as digital minimalism. (1) This ph
- Blank 2: current `0:Digital minimalists do not advocate for a complete abandonment of technology.` -> suggested `2:The constant connectivity, they contend, often leads to anxiety and a diminished sense of fulfillment.`; confidence 0.9; Option C directly continues the negative consequence of constant notifications and scrolling, while Option A introduces a clarification that disrupts the flow.
- Blank 3: current `2:The constant connectivity, they contend, often leads to anxiety and a diminished sense of fulfillment.` -> suggested `0:Digital minimalists do not advocate for a complete abandonment of technology.`; confidence 0.85; Option A logically leads into the following sentence about technology not being inherently harmful, whereas Option C repeats the negative theme already covered.

### seven_select-sp-kaoyan-2i2c2o
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices dominate every waking moment, a growing number of individuals are turning to digital minimalism as a conscious lifestyle choice. (1) Yet this delibe
- Blank 4: current `0:Many people find it easier to quit social media entirely than to moderate their usage.` -> suggested `5:Digital minimalism does not require giving up technology altogether.`; confidence 0.85; The current option about quitting vs. moderating disrupts the logical flow from gradual reduction to benefits; the suggested option directly supports the preceding sentence and leads into the final point.
- Blank 5: current `5:Digital minimalism does not require giving up technology altogether.` -> suggested `0:Many people find it easier to quit social media entirely than to moderate their usage.`; confidence 0.8; The current option is a general statement that fits better earlier; the suggested option provides a contrast that naturally leads into the concluding sentence about intentional usage.

### seven_select-sp-kaoyan-hpq1uo
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The rise of remote work has given birth to a new lifestyle: digital nomadism, where individuals leverage technology to work from anywhere in the world. (1) Yet beneath the surface 
- Blank 2: current `0:Many digital nomads report feeling a sense of rootlessness after months of constant travel.` -> suggested `5:Without a stable community, even the most adventurous individuals can experience isolation.`; confidence 0.85; Blank 2 follows 'exacts a toll on mental health and social connections'; option F directly addresses social disconnection, while option A about rootlessness fits better after mobility in blank 3.
- Blank 3: current `4:Burnout is common when the boundaries between work and leisure blur entirely.` -> suggested `0:Many digital nomads report feeling a sense of rootlessness after months of constant travel.`; confidence 0.8; Blank 3 follows 'constant mobility... exacts a toll on mental health' and leads into financial instability; rootlessness (A) directly connects to mobility and mental health, while burnout (E) is less directly tied.
- Blank 4: current `5:Without a stable community, even the most adventurous individuals can experience isolation.` -> suggested `4:Burnout is common when the boundaries between work and leisure blur entirely.`; confidence 0.8; Blank 4 follows 'financial instability... leads to chronic stress' and precedes 'Loneliness'; burnout (E) fits the stress theme, while isolation (F) is redundant with the next sentence.

### seven_select-sp-kaoyan-vfhkq3
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a remedy for information overload and screen addiction. Advocates argue that by drastically reducing online engagement, i
- Blank 3: current `3:This paradox highlights the need for a more nuanced approach than simple reduction.` -> suggested `2:C. Critics also point out that digital minimalism often ignores the structural inequalities in access to technology.`; confidence 0.9; The preceding sentence introduces a paradox about anxiety from maintaining minimalism; D directly references 'this paradox' and logically follows, while the current key C introduces a new topic (structural inequalities) that breaks coherence.
- Blank 5: current `2:Critics also point out that digital minimalism often ignores the structural inequalities in access to technology.` -> suggested `3:D. This paradox highlights the need for a more nuanced approach than simple reduction.`; confidence 0.85; Blank 5 is the final paragraph before the conclusion; the current key C introduces a new criticism late, while D's call for a nuanced approach better wraps up the argument and leads into the concluding sentence about quality of attention.

### seven_select-sp-中考-1822hy8
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousins and I wanted to give her something special. (1) We thought about buying a cake or flowers, but they seemed too common. Th
- Blank 3: current `2:We wanted to make her happy on her special day.` -> suggested `5:Grandma was surprised and hugged each of us.`; confidence 0.9; The narrative flow after giving the album and Grandma's emotional reaction calls for her immediate response (surprise and hugs), not a general intention.
- Blank 4: current `5:Grandma was surprised and hugged each of us.` -> suggested `2:We wanted to make her happy on her special day.`; confidence 0.85; After Grandma's hug and her statement that it was the best gift, the reflective sentence about wanting to make her happy fits better as a concluding thought, while the hug already occurred earlier.

### seven_select-sp-中考-1o7llmx
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my 15th birthday, but I didn’t feel very excited because my parents were both busy with work. I thought they might have forgotten my special day. (1) I walked int
- Blank 4: current `2:Just then, my parents walked out of the kitchen and said ‘Happy birthday!’` -> suggested `1:B. To my surprise, my parents were hiding behind the kitchen door.`; confidence 0.9; The sequence requires the parents to be discovered hiding before they say 'Happy birthday'; placing C before B breaks the narrative logic.

### seven_select-sp-中考-1u5didt
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I woke up early and found a small box on my desk. (1) I opened it carefully and saw a beautiful pen inside. It was blue and had my name on it. (2) My d
- Blank 5: current `4:It was the best gift I had ever received.` -> suggested `1:I couldn’t help smiling.`; confidence 0.85; The gift was already opened in blank 1; placing 'best gift' at the end is temporally awkward. A reflective closing like smiling fits better.

### seven_select-sp-中考-gt3sui
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, I was at home alone. My parents went to visit my grandparents in another city. (1) Suddenly, I heard a strange noise from the garden. (2) I was a little scared, but 
- Blank 5: current `5:Finally, it became stronger and started to move.` -> suggested `4:I called my parents and told them about the bird.`; confidence 0.9; The current key 'Finally, it became stronger and started to move' is redundant with the following sentence about the bird flying away, and it disrupts the logical sequence. Calling parents fits naturally before the bird's recovery and departure.

### seven_select-sp-高考-1bd5smx
- Type: seven_select; exam: 高考; level: lv2
- Passage: Apologizing is not always easy, but it is a crucial skill in maintaining healthy relationships. (1) However, a sincere apology can repair trust and strengthen bonds between people.
- Blank 1: current `0:Without a sincere apology, misunderstandings may grow and lead to broken relationships.` -> suggested `1:Many people think apologizing is a sign of weakness, but it actually requires great courage.`; confidence 0.9; Option A is a general consequence statement, not a contrast to the opening. Option B provides the needed contrast for 'However'.

### seven_select-sp-高考-1qj9fiy
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies being busy, learning to say no is a valuable skill. Many people struggle with it because they fear disappointing others or missing out on opportunit
- Blank 3: current `0:Learning to say no can improve your mental health and productivity.` -> suggested `6:By doing so, you can avoid unnecessary stress and anxiety.`; confidence 0.9; A is too general and does not follow the example; G directly links to the polite refusal and leads into the next sentence.
- Blank 4: current `6:By doing so, you can avoid unnecessary stress and anxiety.` -> suggested `0:Learning to say no can improve your mental health and productivity.`; confidence 0.85; G is too specific and repetitive after the example; A provides a broader concluding point before the practical advice.

### seven_select-sp-高考-1wnbsun
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often overlook the importance of small talk. (1) However, these brief exchanges can actually have a significant impact on our relationships and well-being. F
- Blank 3: current `4:These small moments of connection can reduce feelings of loneliness.` -> suggested `3:D. This helps create a sense of belonging in a community.`; confidence 0.85; The preceding sentence discusses oxytocin promoting trust and bonding; D directly continues that theme, while E introduces loneliness, which is less coherent.

### seven_select-sp-高考-fxqbnd
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. However, this seemingly trivial conversation plays a crucial role in social bonding. (1) In fact,
- Blank 1: current `0:They help us feel connected to others in a busy world.` -> suggested `1:These small moments of connection can reduce stress and improve mood.`; confidence 0.85; Option A's 'They' lacks a clear plural antecedent; Option B directly follows 'brief, casual interactions' and adds a new benefit.
- Blank 2: current `1:These small moments of connection can reduce stress and improve mood.` -> suggested `0:They help us feel connected to others in a busy world.`; confidence 0.8; Option A generalizes after the example, while Option B would be redundant here.


## Ambiguous / Needs Human Review

### banked_cloze-bp-cet4-15t0z1l
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `1:ignorance`; suggested `8:weakness`; Neither 'ignorance' nor 'weakness' is ideal; 'ignorance' is plausible (child lacks knowledge of danger), and the passage's contrast with curiosity is not strictly required. The item is flawed, but the current key is not clearly wrong.

### banked_cloze-bp-cet4-15t5jmy
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `1:thought`; suggested `5:presence`; Both 'deep thought' and 'deep presence' are plausible; 'thought' is not clearly wrong.

### banked_cloze-bp-cet4-160akbr
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `10:stability`; suggested `10:stability`; 'Stability' is acceptable though not ideal; no clearly better option in the bank.

### banked_cloze-bp-cet4-1765vkj
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `13:distraction`; suggested `3:stimulation`; Both 'distraction' and 'stimulation' are plausible; the key is not clearly wrong.
- Blank 3: current `10:random`; suggested `3:stimulation`; 'Random stimulation' and 'alternative stimulation' both fit; the current key is acceptable.

### banked_cloze-bp-cet4-1aoh8u7
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:conscious`; suggested `11:clear`; 'conscious break' can be interpreted as a deliberate, mindful break, which is acceptable in context; 'clear break' is also plausible but not clearly superior.

### banked_cloze-bp-cet4-1cqu385
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `7:continuous`; suggested `14:reliable`; 'continuous support' is acceptable in context of ongoing government backing; both 'continuous' and 'reliable' are plausible.

### banked_cloze-bp-cet4-1ew8qwv
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `5:emptiness`; suggested `6:confusion`; emptiness fits the context of a negative feeling leading to device use; confusion is also plausible but not clearly better

### banked_cloze-bp-cet4-1l68c2d
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `9:effective`; suggested `5:meaningful`; Both 'effective response' and 'meaningful response' are acceptable; the context does not clearly rule out either.

### banked_cloze-bp-cet4-1lwaq9g
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `5:growing`; suggested `10:fresh`; 'growing popularity' is grammatically acceptable though slightly awkward; no clearly better option exists.

### banked_cloze-bp-cet4-1mjhbbr
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `8:collect`; suggested `3:increase`; 'collect their thoughts' is a common idiom; the current key is acceptable.
- Blank 3: current `7:pressure`; suggested `1:anxiety`; Both 'create pressure' and 'create anxiety' are plausible; current key is acceptable.

### banked_cloze-bp-cet4-1ojqovd
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `11:prevent`; suggested `2:reduce`; Both 'prevent' and 'reduce' are acceptable; 'prevent' is slightly stronger but not incorrect.

### banked_cloze-bp-cet4-1rxz8ru
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `2:unique`; suggested `1:reduced`; 'unique challenges' is acceptable; 'reduced challenges' contradicts the context of facing challenges. However, 'common' might be better, but the current key is not clearly wrong.

### banked_cloze-bp-cet4-59bs7
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `6:massive`; suggested `9:sudden`; 'massive effort' is a common collocation and can fit the context of a single big push; the contrast with small habits does not make it clearly wrong.

### banked_cloze-bp-cet4-he0pdi
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `5:approach`; suggested `1:method`; Both 'approach' and 'method' are acceptable; 'approach' is slightly broader but still correct.

### banked_cloze-bp-cet4-k6owls
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `14:serious`; suggested `2:negative`; 'serious problem' is a common collocation and fits the context; 'negative problem' is also possible but less natural. Both are acceptable.

### banked_cloze-bp-cet4-kneb7h
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `0:interrupted`; suggested `3:distracted`; Both 'interrupted' and 'distracted' are possible; 'interrupted' is acceptable though less common.

### banked_cloze-bp-cet4-oc0grf
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `2:dramatic`; suggested `3:significant`; 'dramatic event' is acceptable; the redundancy with 'sudden breakthrough' is minor and does not make the key clearly wrong.
- Blank 6: current `8:demonstrate`; suggested `14:confirm`; Both 'demonstrate' and 'confirm' are grammatically correct and plausible in context.

### banked_cloze-bp-cet4-t123f2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `3:enhance`; suggested `2:promote`; Both 'enhance' and 'promote' collocate with 'mental health'; 'enhance' is acceptable.
- Blank 7: current `13:establish`; suggested `2:promote`; Both 'establish' and 'promote' are plausible for 'silent rooms'.
- Blank 8: current `2:promote`; suggested `13:establish`; Both 'promote' and 'establish' work with 'a calm atmosphere'.

### banked_cloze-bp-cet4-wcckm1
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `10:valued`; suggested `12:ignored`; 'Valued' can be used neutrally or ironically; 'silence is often valued as a negative element' is grammatically acceptable and not clearly wrong. 'Ignored' is also plausible, making the choice ambiguous.

### banked_cloze-bp-cet4-ydcsjn
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `10:feature`; suggested `12:creative`; 'feature' can be interpreted as a characteristic of urban gardening, and the sentence structure allows it; 'creative' is also plausible but not clearly more correct.

### banked_cloze-bp-cet4-yzfov2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:effective`; suggested `2:reliable`; Both 'effective' and 'reliable' are plausible; 'surprisingly effective' is a common collocation, and the context does not clearly favor one over the other.
- Blank 10: current `2:reliable`; suggested `7:effective`; Both 'reliable' and 'effective' fit the description of a tool for change; the passage does not strongly prefer one.

### banked_cloze-bp-cet4-z6cfo
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `10:trust`; suggested `10:trust`; 'build trust' is acceptable, but 'build connection' (option F) is also plausible; both fit the context.

### banked_cloze-bp-cet6-16x645e
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `7:simplicity`; suggested `7:simplicity`; The passage discusses digital minimalism and reducing screen time; 'simplicity' can be interpreted as a lifestyle of simplicity that includes engaging natural abilities, making it acceptable though not perfect.

### banked_cloze-bp-cet6-19j1m0u
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `3:clear`; suggested `9:rigid`; 'clear boundaries' is grammatically and semantically acceptable; 'rigid' is also plausible but not clearly superior.

### banked_cloze-bp-cet6-1bzxs2i
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `7:moderate`; suggested `3:balanced`; Both 'moderate integration' and 'balanced integration' are acceptable; 'moderate' is not clearly wrong and the key should stay.

### banked_cloze-bp-cet6-1u733e4
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `1:strike`; suggested `13:enhance`; 'strike a balance' is a fixed collocation and perfectly grammatical; 'enhance a balance' is less common but possible. Both are acceptable, so the current key is not clearly wrong.

### banked_cloze-bp-cet6-85u4gu
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 4: current `9:sense`; suggested `7:feeling`; Both 'sense of isolation' and 'feeling of isolation' are acceptable; 'sense' is idiomatic and not clearly wrong.

### banked_cloze-bp-cet6-blqr9w
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `2:restore`; suggested `14:foster`; 'restore' can imply regaining a lost sense of control, which is plausible if the reader had lost it; 'foster' also works but both are acceptable.

### banked_cloze-bp-cet6-bp7o9h
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `1:sustainability`; suggested `2:recycled`; 'Sustainability' is a valid abstract noun that fits the contrast with speed; 'recycled' would require a noun like 'materials' to be grammatical. Both are possible but the current key is acceptable.

### banked_cloze-bp-cet6-fdg57b
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `12:temporary`; suggested `12:`; 'temporary employment benefits' is acceptable as benefits that are not permanent; the context implies workers lack benefits typical of permanent employment, so 'temporary' can modify 'benefits' to mean short-term or non-standard benefits, which fits the contrast with standard benefits.
- Blank 6: current `2:vulnerability`; suggested `7:fragility`; 'vulnerability of data privacy' is not standard but can be understood as the state of being vulnerable; 'fragility' is also not ideal. Both are possible, and the passage does not clearly rule out 'vulnerability'.

### banked_cloze-bp-cet6-fnzn4h
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `11:underestimated`; suggested `2:overlooked`; Both 'underestimated' and 'overlooked' are grammatically and semantically plausible; 'overlooked' is slightly more natural but not clearly superior.
- Blank 5: current `9:dilemma`; suggested `5:paradox`; Both 'dilemma' and 'paradox' fit the context; 'paradox' may better capture the contradiction, but 'dilemma' is also acceptable.

### banked_cloze-bp-cet6-h3xw34
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `10:presence`; suggested `6:imbalanced`; 'presence of biased data' is grammatically correct and semantically plausible; 'imbalanced' is also possible but not clearly superior.

### banked_cloze-bp-cet6-ifo4q0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `8:foster`; suggested `10:restore`; 'foster' (promote development) is acceptable, but 'restore' (bring back a healthier relationship) also fits; both are plausible.

### banked_cloze-bp-cet6-mbcf6n
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `10:strict`; suggested `2:flexible`; Both 'strict' and 'flexible' could fit: 'strict boundaries' is a common collocation and the passage mentions 'designating tech-free hours or zones' which can be strict rules, while 'flexible' also aligns with a mindful approach. The context does not clearly rule out 'strict'.

### banked_cloze-bp-cet6-mcvz40
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `11:deliberately`; suggested `5:excessive`; 'deliberately reducing' is grammatically correct and semantically plausible as it describes intentional action, which aligns with the theme of digital minimalism. 'Excessive' is also plausible but not clearly superior.

### banked_cloze-bp-cet6-ng1zcd
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `6:merits`; suggested `14:impacts`; Both 'merits' and 'impacts' are grammatically correct and contextually plausible; 'merits' emphasizes benefits, 'impacts' is neutral.

### banked_cloze-bp-cet6-oj0k7s
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 7: current `14:enthusiasm`; suggested `14:enthusiasm`; The noun 'enthusiasm' can grammatically fit and semantically refer to the fervor for digital minimalism, though not ideal; no clearly better option exists.

### banked_cloze-bp-cet6-y5915z
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `9:deliberate`; suggested `12:excessive`; Both 'deliberate reduction' and 'excessive reduction' are grammatically and semantically plausible; the current key is acceptable.
- Blank 6: current `14:persistent`; suggested `12:excessive`; Both 'persistent distraction' and 'excessive distraction' fit; the current key is not clearly wrong.

### seven_select-sp-kaoyan-10pripf
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `3:Yet the very structure of digital minimalism can paradoxically create new forms of isolation.`; suggested `4:Such serendipity is difficult to replicate through deliberate online networking.`; Both options can fit: current D introduces a new but relevant point about isolation, while suggested E links to serendipity from earlier; neither is clearly wrong.
- Blank 5: current `4:Such serendipity is difficult to replicate through deliberate online networking.`; suggested `3:Yet the very structure of digital minimalism can paradoxically create new forms of isolation.`; Current E about serendipity can serve as a lead-in to the conclusion, and D about isolation also works; both are plausible, so not clearly wrong.

### seven_select-sp-kaoyan-10zdhmd
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `2:Studies indicate that frequent task-switching can reduce overall productivity by as much as 40%.`; suggested `6:Such addictive patterns make it increasingly difficult to disengage from the digital environment.`; Both C and G could fit: C's task-switching is related to the preceding mention of distraction, and G's addictive patterns also connect to the dopamine cycle; the current key is not clearly wrong.

### seven_select-sp-kaoyan-1242wky
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `5:This perspective, however, overlooks the fact that not everyone can afford to opt out of the digital economy.`; suggested `3:D. Many people find it impossible to maintain a balanced digital diet without external support.`; Option F fits as a transitional critique of the preceding 'nuanced approach' sentence, and the passage's flow does not clearly require D; both are plausible.

### seven_select-sp-kaoyan-12os50s
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `5:Those who choose to disconnect may also face practical inconveniences, such as difficulty coordinating group activities.`; suggested `2:C. Many people find it difficult to maintain a complete digital detox while still meeting work and family obligations.`; Both F and C could fit: F extends the idea of professional drawbacks (inconveniences like coordinating group activities), while C directly addresses work obligations. The passage does not clearly rule out F, and the suggested C is not uniquely correct.

### seven_select-sp-kaoyan-12resji
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `1:The constant flow of notifications and the pressure to remain ‘always on’ have been linked to increased rates of anxiety and depression.`; suggested `0:Employees, in turn, feel compelled to respond to messages at all hours, blurring the line between being ‘at work’ and ‘off duty.’`; Both B and A are plausible; B continues the cause-effect chain from 'techno-stress' and notifications, while A provides a logical consequence of organizational encouragement. The flow is not clearly disrupted.
- Blank 4: current `0:Employees, in turn, feel compelled to respond to messages at all hours, blurring the line between being ‘at work’ and ‘off duty.’`; suggested `1:The constant flow of notifications and the pressure to remain ‘always on’ have been linked to increased rates of anxiety and depression.`; Both A and B could fit; A follows the discussion of fragmented attention and deep focus by showing a behavioral consequence, while B extends the negative effects. Neither is clearly wrong.

### seven_select-sp-kaoyan-148jnzu
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `3:Social media platforms are engineered to exploit this vulnerability, keeping users hooked through intermittent rewards.`; suggested `6:These findings challenge the popular assumption that multitasking is an efficient way to handle information.`; Option D fits after the study example, but option G also fits as a conclusion to the study; both are acceptable but not uniquely best.

### seven_select-sp-kaoyan-1jvydjm
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `3:This is why many companies offer a limited number of product variants to simplify consumer decisions.`; suggested `5:Therefore, the key to happiness lies in learning to embrace constraints and appreciate simplicity.`; The current key (D) about companies simplifying choices is a plausible logical step after the vacation example, but the suggested (F) also fits as a broader conclusion. Both are coherent.
- Blank 5: current `5:Therefore, the key to happiness lies in learning to embrace constraints and appreciate simplicity.`; suggested `3:This is why many companies offer a limited number of product variants to simplify consumer decisions.`; The current key (F) is a natural concluding sentence for the passage, while the suggested (D) could follow the mention of high-stakes decisions but is less direct. Both are acceptable.

### seven_select-sp-kaoyan-1smab29
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `3:The same technology that connects us also makes withdrawal socially awkward.`; suggested `4:E. These unintended consequences challenge the assumption that less screen time is always beneficial.`; D is a plausible concluding remark that echoes the paradox of technology, and the passage does not require a direct reference to 'unintended consequences'; both D and E could fit.

### seven_select-sp-kaoyan-1wuspab
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `4:A 2019 study found that it takes an average of 23 minutes to refocus after an interruption.`; suggested `5:Some progressive firms even offer training programs on mindfulness and time management.`; Option E provides a specific statistic that can logically follow the general claim about interruptions, and the experiment in the next sentence can serve as a separate supporting detail. The flow is not clearly broken, and both E and F could fit depending on interpretation.

### seven_select-sp-kaoyan-20pp9m
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `1:Many people find it impossible to disconnect from their devices even for a short period.`; suggested `5:Critics, however, warn that such practices may isolate individuals from essential social networks.`; Both Option B and Option F are plausible; Option F provides a contrasting viewpoint that leads naturally to the conclusion, but Option B is not clearly wrong.

### seven_select-sp-kaoyan-392i5x
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `2:Instead, we should embrace periodic digital detoxes and set clear boundaries for screen time.`; suggested `4:Therefore, universities have begun implementing policies that restrict smartphone use in classrooms.`; The example of college students could lead to a policy response (E), but the 'Yet' sentence that follows introduces a nuanced solution, making the general advice (C) also plausible as a contrast. Both options fit the context.

### seven_select-sp-kaoyan-8tw2je
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `6:Yet the same technology that empowers us also entraps us in a cycle of perpetual distraction.`; suggested `5:Some experts argue that digital detox retreats are merely temporary fixes for a systemic problem.`; Option G fits the context of technology entrapping us, and the next sentence about a generation being connected yet isolated follows naturally. Option F is also plausible but not clearly superior.
- Blank 5: current `1:Many people now report feeling anxious when separated from their devices for even a short period.`; suggested `5:Some experts argue that digital detox retreats are merely temporary fixes for a systemic problem.`; Option B about anxiety is acceptable as a lead-in to the concluding call for disconnection. Option F is also plausible but not clearly more correct.

### seven_select-sp-kaoyan-bbi9u9
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `6:The brain requires a recovery period after each switch to refocus.`; suggested `4:Such findings challenge the widely held belief that multitasking boosts efficiency.`; Both G (supporting detail) and E (summary) are acceptable; E provides a stronger concluding link to the following recommendation, but G does not break coherence.

### seven_select-sp-kaoyan-c8eqw9
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `5:In fact, the absence of physical presence has made it harder for managers to assess employee performance accurately.`; suggested `1:Many firms have invested heavily in video conferencing software to bridge the physical distance.`; Option F is not clearly wrong; it can be seen as a concrete example of the 'tools of connection' mentioned in the preceding quote, and the final sentence 'bridge this gap' can refer broadly to the gap in connection, not necessarily only to technological solutions. Option B is also plausible but not uniquely correct.

### seven_select-sp-kaoyan-cjr8pq
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `1:Many digital minimalists report feeling more productive and less anxious after reducing screen time.`; suggested `6:Some experts warn that extreme digital detoxes could lead to social anxiety in face-to-face settings.`; Option B is a plausible continuation of the argument about benefits of reduced screen time, and the passage's conclusion already advocates balance; G is also possible but not clearly more correct.

### seven_select-sp-kaoyan-hpq1uo
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `1:Tax regulations and visa restrictions often complicate the seemingly carefree lifestyle.`; suggested `6:Health insurance and retirement savings become logistical nightmares across borders.`; Both B and G discuss practical complications; B fits the 'seemingly carefree lifestyle' contrast, but G also aligns with financial/logistical challenges. Current choice is acceptable but not uniquely best.

### seven_select-sp-kaoyan-jjbjy6
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `3:Digital minimalism has been criticized for being too extreme and unrealistic in a hyper-connected world.`; suggested `1:Critics argue that digital minimalism is merely a privilege for those who can afford to disconnect, ignoring the realities of low-income workers.`; The passage ends with a positive conclusion, but the current option D (criticism of extremism) could be read as a final counterpoint before the concluding sentence, which is already present. Option B introduces a different critique that may also fit, but neither is clearly wrong; the passage structure allows some flexibility.

### seven_select-sp-kaoyan-m90dyp
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `2:Many report that their offline relationships have actually deepened as a result.`; suggested `6:Nevertheless, the pressure to stay connected remains strong in most professional environments.`; Option C can be read as a positive outcome that contrasts with the negative example that follows, maintaining coherence. Option G introduces a new topic not directly supported by the surrounding context. Both are possible, but the current key is not clearly wrong.

### seven_select-sp-kaoyan-peak5j
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `5:The solution lies in redesigning our digital environments.`; suggested `1:B. Many people now check their phones over 150 times per day.`; Option F fits as a logical transition after the example, introducing a solution before the final paragraph. Option B also fits as a supporting statistic. Both are plausible.

### seven_select-sp-kaoyan-ry5zyv
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `0:Many people pride themselves on their ability to reply to emails while attending virtual meetings.`; suggested `6:Interestingly, younger generations tend to believe they are better at multitasking than older adults.`; Option A provides a concrete example of multitasking behavior that illustrates the preceding concept of attentional blink, and the transition to the next sentence about heavy multitaskers is coherent. Option G also fits but is not clearly superior.
- Blank 4: current `3:Some companies even encourage employees to respond to messages instantly across multiple platforms.`; suggested `0:Many people pride themselves on their ability to reply to emails while attending virtual meetings.`; Option D offers a workplace example that logically follows the discussion of distractibility and leads to stress from interruptions. Option A could also fit as a parallel example, so the current key is not clearly wrong.

### seven_select-sp-kaoyan-tk7afb
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `6:Some advocates even recommend periodic 'digital detoxes' as a way to reset one's relationship with technology.`; suggested `0:The pressure to constantly stay connected can paradoxically increase anxiety rather than reduce it.`; Option G is a plausible concluding remark about digital detoxes, and the passage does not strictly require a counterpoint; both G and A could fit, making the choice ambiguous.

### seven_select-sp-中考-1aqvfm7
- Type: seven_select; exam: 中考; level: lv1
- Blank 1: current `1:Don't forget to wear warm clothes when you go outside.`; suggested `-1:`; The current option is a general winter tip that could fit as a concluding sentence for the intro, though it slightly disrupts the flow. It is not clearly wrong.
- Blank 4: current `6:Many people get sick because they don't drink water.`; suggested `-1:`; The current option provides a reason to drink water, which is loosely connected to the tip. It is not clearly ungrammatical or incoherent, though not ideal.

### seven_select-sp-中考-1i85gx6
- Type: seven_select; exam: 中考; level: lv1
- Blank 4: current `3:After dinner, I helped my mother wash the dishes.`; suggested `0:Later that day, I went to the park with my friends.`; The current option 'After dinner, I helped my mother wash the dishes' could be a plausible follow-up after the birthday scene, as dinner is a natural part of a birthday celebration. The suggested option is also plausible but not clearly more correct. Both could fit, so the current key is not clearly wrong.

### seven_select-sp-中考-1k688xk
- Type: seven_select; exam: 中考; level: lv1
- Blank 5: current `2:C. He remembered his grandfather’s kind smile.`; suggested `-1:`; Option C can be interpreted as Tom's reflective thought after the discovery, fitting the emotional conclusion; the chronological disruption is not severe enough to deem it clearly wrong.

### seven_select-sp-中考-1o7llmx
- Type: seven_select; exam: 中考; level: lv1
- Blank 5: current `6:I couldn’t believe they remembered my dream.`; suggested `6:`; G works as a concluding thought after the hug, but could also fit after blank 3; not clearly wrong, but not uniquely best.

### seven_select-sp-中考-1rk43h0
- Type: seven_select; exam: 中考; level: lv1
- Blank 4: current `4:Later, my mother brought out a big cake and we sang birthday songs.`; suggested `1:B. After dinner, my parents took me to the cinema to watch a movie.`; The current key (E) is plausible as a later celebration after building the model, and the diary entry could still follow. The suggested movie option is also plausible but not clearly more correct.

### seven_select-sp-中考-1v3zxmj
- Type: seven_select; exam: 中考; level: lv1
- Blank 4: current `2:I was surprised and started to watch more carefully.`; suggested `4:E. The garden became my favorite place to play.`; Option C fits as a natural reaction after the explanation, and the passage does not explicitly state surprise earlier; both C and E are plausible here.

### seven_select-sp-中考-6li36c
- Type: seven_select; exam: 中考; level: lv1
- Blank 3: current `6:G. Making a card was not easy for me.`; suggested `5:F. I wrote a long poem on the back.`; Both options could fit: the current key reflects on difficulty, which can be a natural pause before finishing; the suggested option adds content before envelope. Neither is clearly wrong.
- Blank 5: current `5:F. I wrote a long poem on the back.`; suggested `6:G. Making a card was not easy for me.`; The current key (poem) is acceptable as a final detail before the conclusion; the suggested reflection could also work. No clear error.

### seven_select-sp-中考-nocq94
- Type: seven_select; exam: 中考; level: lv1
- Blank 3: current `4:Nodding your head sometimes is also helpful.`; suggested `3:Looking at someone shows you are honest.`; Both 'Nodding your head' and 'Looking at someone' can logically follow 'smile and look the person in the eye', as nodding is a natural friendly gesture and looking is directly mentioned; the current key is not clearly wrong.

### seven_select-sp-高考-12ip10v
- Type: seven_select; exam: 高考; level: lv2
- Blank 2: current `3:However, silence can be a powerful tool in communication, allowing both parties to process thoughts and emotions.`; suggested `1:It is often said that silence speaks louder than words.`; The current key 'However' may be slightly redundant but is still grammatically acceptable and fits the logical progression; the suggested option is also plausible, making the choice ambiguous.

### seven_select-sp-高考-1318vtw
- Type: seven_select; exam: 高考; level: lv2
- Blank 3: current `0:We often see boredom as something negative to avoid.`; suggested `3:Many people consider boredom a waste of time.`; Both A and D are plausible; A introduces a common negative view that contrasts with the following advice, and D is also acceptable. The passage does not require a strict contrast, so the current key is not clearly wrong.

### seven_select-sp-高考-1bd5smx
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `4:Sometimes, people apologize just to end an argument, which is not effective.`; suggested `3:Finally, remember that actions speak louder than words when it comes to making things right.`; Option E is somewhat related but less directly connected to the following sentences about patience and actions. Option D leads more naturally, but E is not clearly unacceptable.

### seven_select-sp-高考-1gxrgid
- Type: seven_select; exam: 高考; level: lv2
- Blank 1: current `3:Instead of relying on willpower, they should design their environment for success.`; suggested `4:This is why many people give up on their New Year's resolutions within weeks.`; Option D (environment design) is a plausible continuation after the initial problem statement, as it offers a solution-oriented approach. Option E (giving up on resolutions) also fits but is not clearly superior; both are acceptable.
- Blank 4: current `0:However, waiting for motivation often leads to delay and disappointment.`; suggested `3:Instead of relying on willpower, they should design their environment for success.`; Option A (waiting for motivation) can be seen as a contrast to the previous sentence about reducing psychological barriers, and it fits the theme of common pitfalls. Option D (environment design) also fits but is not clearly more correct; both are plausible.

### seven_select-sp-高考-1lcoh8q
- Type: seven_select; exam: 高考; level: lv2
- Blank 2: current `3:Even a brief chat with a stranger can brighten your day.`; suggested `2:C. Without these small exchanges, it's hard to build trust.`; Both D and C are plausible; D offers a concrete example of brightening a day, while C directly continues the community-building idea.
- Blank 3: current `2:Without these small exchanges, it's hard to build trust.`; suggested `3:D. Even a brief chat with a stranger can brighten your day.`; C fits the trust-building context, but D also works as a lighter example before the 'Moreover' sentence; neither is clearly wrong.

### seven_select-sp-高考-1m4on5x
- Type: seven_select; exam: 高考; level: lv2
- Blank 3: current `1:This skill is especially important in a world that constantly demands more of us.`; suggested `0:Many people struggle with the fear of being seen as selfish.`; Both B and A could fit: B connects to the previous sentence about the importance of the skill, while A continues the fear theme. The passage does not clearly rule out B.

### seven_select-sp-高考-1mrvra4
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `5:They do not wait for motivation but rely on discipline.`; suggested `1:These small actions might seem unimportant at first glance.`; Both F and B are plausible; F maintains subject continuity, B comments on the steps.

### seven_select-sp-高考-1v3xdy7
- Type: seven_select; exam: 高考; level: lv2
- Blank 2: current `3:The same principle applies to learning a new language or skill.`; suggested `1:B. Similarly, saving a small amount of money each day can build a fortune.`; Both D and B are plausible; D generalizes the principle, B gives a parallel example. Neither is clearly wrong.
- Blank 4: current `6:Therefore, don't underestimate the power of tiny changes.`; suggested `2:C. Habits are the foundation of long-term success and personal growth.`; G is a valid concluding remark, but C directly follows the identity-shaping idea. Both fit, so ambiguous.
- Blank 5: current `1:Similarly, saving a small amount of money each day can build a fortune.`; suggested `6:G. Therefore, don't underestimate the power of tiny changes.`; B is an example that seems less fitting at the end, but G is a natural conclusion. However, B is not ungrammatical or clearly wrong; both are possible.

### seven_select-sp-高考-1vn3uu7
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `4:In contrast, waiting for the perfect moment often leads to inaction.`; suggested `5:F. Many people fail because they try to do too much too soon.`; Option E offers a contrast that can be interpreted as a caution against waiting, which loosely connects to the idea of making behavior easy; Option F also fits but is not clearly more correct. Both are plausible.

### seven_select-sp-高考-1wnbsun
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `1:Furthermore, small talk can be useful in the workplace.`; suggested `4:E. These small moments of connection can reduce feelings of loneliness.`; Both B (workplace example) and E (general consequence) fit after the oxytocin statement; neither is clearly superior.

### seven_select-sp-高考-fxqbnd
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `2:Even a simple greeting can make someone feel valued.`; suggested `5:Many friendships have started from a casual comment about the weather.`; Both Option C and Option F are plausible; Option F directly illustrates the preceding idea.
- Blank 5: current `5:Many friendships have started from a casual comment about the weather.`; suggested `2:Even a simple greeting can make someone feel valued.`; Both Option F and Option C could work; the current key is not clearly wrong.

### seven_select-sp-高考-g2qxy7
- Type: seven_select; exam: 高考; level: lv2
- Blank 2: current `2:This does not mean you should never help others, but rather be selective.`; suggested `5:Without this skill, you may find yourself overwhelmed and unhappy.`; The current option C logically follows the first sentence about learning to say no, and the example in the next sentence illustrates selective refusal, not necessarily consequence of lacking the skill.
- Blank 5: current `5:Without this skill, you may find yourself overwhelmed and unhappy.`; suggested `2:This does not mean you should never help others, but rather be selective.`; The current option F works as a concluding warning about lacking the skill, while the suggested option also fits as a final balanced remark; both are plausible.

### seven_select-sp-高考-gzclpr
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `3:Many people feel guilty when they turn down a request from a friend.`; suggested `6:Practicing this skill in low-stakes situations can build your confidence.`; The current key (D) about guilt with friends is not clearly incoherent; it can be seen as a natural extension of the difficulty of saying no, and the suggested option (G) is also plausible but not clearly superior.

### seven_select-sp-高考-hv9kh7
- Type: seven_select; exam: 高考; level: lv2
- Blank 3: current `6:Without this, the apology may come across as empty words.`; suggested `3:D. Experts suggest that a good apology should be specific and timely.`; The current key G has a plausible antecedent ('a clear acknowledgment of the hurt caused and a commitment to change'), so it is not clearly wrong; D also fits but is not uniquely correct.
- Blank 5: current `5:Learning to apologize well is a sign of emotional maturity.`; suggested `1:B. Many people apologize just to avoid conflict, but that often backfires.`; F is a reasonable concluding statement about emotional maturity; B offers a contrast but does not clearly outrank F in coherence with the preceding sentence.

### seven_select-sp-高考-pxulu3
- Type: seven_select; exam: 高考; level: lv2
- Blank 5: current `3:However, the real power lies in the compound effect of these small actions.`; suggested `2:C. Many people give up because they expect instant results.`; The current key D fits as a concluding remark on compound effect, but C also fits as a contrast to patience; both are plausible.

### seven_select-sp-高考-ra6a9y
- Type: seven_select; exam: 高考; level: lv2
- Blank 5: current `5:On the contrary, saying “yes” to everything often leads to burnout and resentment.`; suggested `4:Therefore, it is crucial to practice saying “no” in a respectful way.`; Both options can fit: 'On the contrary' contrasts with the preceding idea about focusing on what matters, while 'Therefore' offers a concluding statement; the paragraph does not strictly require a conclusion.

### seven_select-sp-高考-siydko
- Type: seven_select; exam: 高考; level: lv2
- Blank 4: current `0:A. Many people feel guilty when they refuse a request.`; suggested `3:D. This approach helps you focus on what truly matters.`; Option A is not clearly wrong; it can be seen as a natural extension of the previous sentence about boundaries improving relationships, as guilt is a common emotion when setting boundaries. Option D also fits, but the current key is acceptable.

### seven_select-sp-高考-u4w46a
- Type: seven_select; exam: 高考; level: lv2
- Blank 2: current `0:Similarly, exercising for 15 minutes daily can improve your health dramatically.`; suggested `3:Small changes are less likely to be abandoned when life gets busy.`; The example of reading 10 pages is given; 'Similarly' works but the paragraph later discusses ease of sticking with habits, making D a stronger local fit.
- Blank 3: current `1:Therefore, it's better to aim for slow but steady progress.`; suggested `4:Once a habit is formed, it requires less effort to maintain.`; The sentence before talks about building momentum and confidence; 'Therefore' is acceptable but E connects more directly to the idea of habits becoming easier.
- Blank 4: current `3:Small changes are less likely to be abandoned when life gets busy.`; suggested `1:Therefore, it's better to aim for slow but steady progress.`; The sentence before says 'small habits are easier to stick with'; D fits well, but B also logically follows as a conclusion. Both are acceptable.
- Blank 5: current `4:Once a habit is formed, it requires less effort to maintain.`; suggested `3:Small changes are less likely to be abandoned when life gets busy.`; The preceding sentence talks about changes becoming part of identity; E fits, but D also fits as a reason why tiny changes stick. Both are plausible.

### seven_select-sp-高考-ussxyt
- Type: seven_select; exam: 高考; level: lv2
- Blank 5: current `1:People often feel awkward when starting a conversation.`; suggested `3:Some individuals prefer to remain silent in public places.`; Option B is not clearly wrong; it can be seen as a plausible consequence of lacking light exchanges (awkwardness leading to silence). Option D also fits but is not uniquely correct.

### seven_select-sp-高考-xotdfc
- Type: seven_select; exam: 高考; level: lv2
- Blank 3: current `5:Silence is often misunderstood in modern society.`; suggested `2:Silence can also inspire creativity.`; The current key 'Silence is often misunderstood in modern society' could be seen as a general statement that fits the paragraph's shift to positive uses, but the suggested 'inspire creativity' also fits the meeting context; both are plausible.


## Shape Issues

No structural issues found.

## AI Errors

No AI/API errors.

## Notes

- Confirmed wrong requires two passes: pass 1 flags a blank, pass 2 confirms it.
- Ambiguous means the item should be reviewed by a human before changing the answer key.
- The script intentionally does not modify Supabase.
