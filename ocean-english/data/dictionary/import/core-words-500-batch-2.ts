/**
 * LexiOcean Phase 8B-3 Core Vocabulary Batch 2 (120 words)
 *
 * COMPLIANCE DECLARATION:
 *   All entries are original LexiOcean educational seed content.
 *   No commercial dictionary text, public exam lists, real exam questions, or
 *   user-uploaded document content is included.
 */

import type { DictionaryImportWord } from '@/lib/dictionary/dictionary-import-types'

const SOURCE_NOTE = 'Original educational content created for LexiOcean Phase 8B-3 dictionary batch 2.'

type Pos = 'noun' | 'verb' | 'adjective' | 'adverb'
type Cefr = 'A2' | 'B1' | 'B2' | 'C1'
type Diff = 1 | 2 | 3 | 4 | 5

type Row = [
  word: string,
  pos: Pos,
  cefr: Cefr,
  difficulty: Diff,
  meaning: string,
  zh: string,
  theme: string,
  domain: string,
  synonyms: string[],
  antonyms: string[],
]

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function posPhrase(pos: Pos): string {
  if (pos === 'verb') return 'action'
  if (pos === 'adjective') return 'quality'
  if (pos === 'adverb') return 'way of doing something'
  return 'idea or thing'
}

function makeEntry([word, pos, cefrLevel, difficultyLevel, meaning, zh, theme, domain, synonyms, antonyms]: Row): DictionaryImportWord {
  const normalizedWord = normalize(word)
  const themeTag = normalize(theme)
  const domainTag = normalize(domain)
  const isExamWord = difficultyLevel >= 3

  return {
    word,
    normalizedWord,
    ipa: `/${normalizedWord}/`,
    partOfSpeech: [pos],
    cefrLevel,
    difficultyLevel,
    isCoreWord: true,
    isExamWord,
    definitions: [
      {
        language: 'en',
        definition: `${word} is a ${posPhrase(pos)} meaning ${meaning}.`,
        definitionType: 'learning',
      },
      {
        language: 'zh',
        definition: zh,
        definitionType: 'learning',
      },
    ],
    examples: [
      {
        sentenceEn: `In a ${theme} task, learners can use "${word}" to describe ${meaning}.`,
        sentenceZh: `\u5728${theme}\u573a\u666f\u4e2d\uff0c\u5b66\u4e60\u8005\u53ef\u4ee5\u7528 ${word} \u8868\u8fbe\u201c${zh}\u201d\u3002`,
        sourceType: 'original_seed',
      },
    ],
    collocations: [
      {
        phrase: `${word} pattern`,
        exampleEn: `The class discussed a common ${word} pattern in context.`,
        exampleZh: `\u8bfe\u5802\u4e0a\u8ba8\u8bba\u4e86\u4e00\u4e2a\u5e38\u89c1\u7684 ${word} pattern\u3002`,
      },
      {
        phrase: `${word} practice`,
        exampleEn: `Short ${word} practice helped the learner notice the word in reading.`,
        exampleZh: `\u7b80\u77ed\u7684 ${word} practice \u5e2e\u52a9\u5b66\u4e60\u8005\u5728\u9605\u8bfb\u4e2d\u8bc6\u522b\u8be5\u8bcd\u3002`,
      },
    ],
    synonyms,
    antonyms,
    relatedWords: [themeTag, domainTag, ...synonyms.map(normalize)].filter(Boolean),
    mnemonics: [
      {
        mnemonic: `Link "${word}" to ${theme}; the scene gives the meaning a practical anchor.`,
        mnemonicZh: `\u628a ${word} \u548c${theme}\u573a\u666f\u8fde\u5728\u4e00\u8d77\u8bb0\u5fc6\u3002`,
        type: 'standard',
      },
    ],
    etymologyBrief: `LexiOcean learner note: "${word}" belongs to ${domain} vocabulary used in ${theme}.`,
    sceneUsage: [`${theme} conversation`, `${domain} reading`, `${domain} writing`],
    examTags: isExamWord ? (difficultyLevel >= 4 ? ['TOEFL', 'IELTS'] : ['CET-4', 'CET-6']) : [],
    themeTags: [themeTag],
    domainTags: [domainTag],
    wordFamily: [normalizedWord],
    sourceType: 'original_seed',
    sourceNote: SOURCE_NOTE,
  }
}

const ROWS: Row[] = [
  ['forecast', 'verb', 'B2', 3, 'to predict a future condition using available information', '\u9884\u6d4b', 'future thinking', 'academic', ['predict', 'project'], ['review']],
  ['campaign', 'noun', 'B2', 3, 'an organized set of actions to reach a public or business goal', '\u6d3b\u52a8\uff1b\u8fd0\u52a8', 'organization', 'business', ['initiative', 'drive'], ['inaction']],
  ['agenda', 'noun', 'B1', 2, 'a list of topics or tasks planned for discussion', '\u8bae\u7a0b', 'planning', 'business', ['schedule', 'plan'], ['improvisation']],
  ['diagram', 'noun', 'B1', 2, 'a simple drawing that explains parts or relationships', '\u56fe\u8868\uff1b\u793a\u610f\u56fe', 'visual explanation', 'education', ['chart', 'figure'], ['paragraph']],
  ['attitude', 'noun', 'B1', 2, 'a way of thinking or feeling about something', '\u6001\u5ea6', 'daily communication', 'daily', ['view', 'mindset'], ['indifference']],
  ['boundary', 'noun', 'B2', 3, 'a line or limit between areas, ideas, or responsibilities', '\u8fb9\u754c\uff1b\u754c\u9650', 'limits', 'academic', ['limit', 'border'], ['openness']],
  ['facility', 'noun', 'B1', 2, 'a place, tool, or service provided for a purpose', '\u8bbe\u65bd\uff1b\u573a\u6240', 'project work', 'business', ['site', 'service'], ['shortage']],
  ['hypothesis', 'noun', 'B2', 3, 'an idea that can be tested by evidence', '\u5047\u8bbe', 'research', 'academic', ['proposal', 'assumption'], ['fact']],
  ['candidate', 'noun', 'B2', 3, 'a person or option being considered for a role or choice', '\u5019\u9009\u4eba\uff1b\u5019\u9009\u9879', 'selection', 'business', ['applicant', 'option'], ['reject']],
  ['research', 'noun', 'B1', 2, 'careful study to discover or explain information', '\u7814\u7a76', 'study', 'academic', ['investigation', 'study'], ['guess']],
  ['theory', 'noun', 'B2', 3, 'an organized explanation for why something happens', '\u7406\u8bba', 'academic reasoning', 'academic', ['explanation', 'model'], ['practice']],
  ['variable', 'noun', 'B2', 3, 'a factor that can change in a study or system', '\u53d8\u91cf', 'research', 'academic', ['factor', 'element'], ['constant']],
  ['habit', 'noun', 'A2', 1, 'a regular behavior repeated often', '\u4e60\u60ef', 'daily life', 'daily', ['routine', 'custom'], ['exception']],
  ['choice', 'noun', 'A2', 1, 'an option selected from several possibilities', '\u9009\u62e9', 'daily decision', 'daily', ['option', 'selection'], ['requirement']],
  ['reason', 'noun', 'A2', 1, 'an explanation for why something happens or is done', '\u539f\u56e0\uff1b\u7406\u7531', 'communication', 'daily', ['cause', 'explanation'], ['result']],
  ['journey', 'noun', 'A2', 1, 'travel from one place or stage to another', '\u65c5\u7a0b', 'daily life', 'daily', ['trip', 'path'], ['stop']],
  ['effort', 'noun', 'A2', 1, 'energy used to do something difficult', '\u52aa\u529b', 'learning progress', 'education', ['work', 'attempt'], ['ease']],
  ['mistake', 'noun', 'A2', 1, 'something done or understood incorrectly', '\u9519\u8bef', 'learning progress', 'education', ['error', 'fault'], ['accuracy']],
  ['appliance', 'noun', 'B1', 2, 'a machine used for a practical task at home or work', '\u5668\u5177\uff1b\u5bb6\u7528\u7535\u5668', 'daily life', 'daily', ['device', 'machine'], ['manual tool']],
  ['schedule', 'noun', 'A2', 1, 'a plan for when events or tasks happen', '\u65e5\u7a0b\uff1b\u8ba1\u5212\u8868', 'planning', 'daily', ['timetable', 'plan'], ['delay']],
  ['neighbor', 'noun', 'A2', 1, 'a person who lives near another person', '\u90bb\u5c45', 'community', 'daily', ['resident', 'local'], ['stranger']],
  ['decision', 'noun', 'B1', 2, 'a choice made after thinking', '\u51b3\u5b9a', 'daily decision', 'daily', ['choice', 'judgment'], ['hesitation']],
  ['algorithm', 'noun', 'B2', 3, 'a step-by-step rule for solving a problem or processing data', '\u7b97\u6cd5', 'technology', 'technology', ['procedure', 'method'], ['randomness']],
  ['automation', 'noun', 'C1', 4, 'the use of systems to do tasks with little human effort', '\u81ea\u52a8\u5316', 'technology', 'technology', ['mechanization', 'workflow'], ['manual work']],
  ['database', 'noun', 'B1', 2, 'an organized collection of stored information', '\u6570\u636e\u5e93', 'technology', 'technology', ['data store', 'repository'], ['paper file']],
  ['interface', 'noun', 'B2', 3, 'the surface or system through which people use a tool', '\u754c\u9762\uff1b\u63a5\u53e3', 'technology', 'technology', ['control panel', 'gateway'], ['barrier']],
  ['network', 'noun', 'B1', 2, 'a connected group of people, devices, or systems', '\u7f51\u7edc', 'technology', 'technology', ['system', 'web'], ['isolation']],
  ['prompt', 'noun', 'B1', 2, 'an instruction or cue that guides a response', '\u63d0\u793a\u8bcd\uff1b\u63d0\u793a', 'ai learning', 'technology', ['cue', 'instruction'], ['silence']],
  ['model', 'noun', 'B1', 2, 'a simplified example or system used to explain something', '\u6a21\u578b', 'technology', 'technology', ['framework', 'example'], ['reality']],
  ['signal', 'noun', 'B1', 2, 'a sign or message that carries information', '\u4fe1\u53f7', 'technology', 'technology', ['message', 'indication'], ['noise']],
  ['virtual', 'adjective', 'B2', 3, 'existing through computer systems rather than physical space', '\u865a\u62df\u7684', 'digital life', 'technology', ['digital', 'simulated'], ['physical']],
  ['contract', 'noun', 'B2', 3, 'a formal agreement between people or organizations', '\u5408\u540c', 'business', 'business', ['agreement', 'deal'], ['dispute']],
  ['invoice', 'noun', 'B2', 3, 'a document that asks for payment for goods or services', '\u53d1\u7968\uff1b\u8d26\u5355', 'business', 'business', ['bill', 'statement'], ['receipt']],
  ['material', 'noun', 'B1', 2, 'substance or information used to make or support something', '\u6750\u6599\uff1b\u8d44\u6599', 'engineering', 'engineering', ['substance', 'resource'], ['waste']],
  ['progress', 'noun', 'B1', 2, 'movement toward a better or more complete state', '\u8fdb\u5c55', 'project work', 'business', ['advance', 'improvement'], ['setback']],
  ['supplier', 'noun', 'B2', 3, 'a person or company that provides goods or services', '\u4f9b\u5e94\u5546', 'business', 'business', ['provider', 'vendor'], ['customer']],
  ['budget', 'noun', 'B1', 2, 'a plan for how money will be used', '\u9884\u7b97', 'business', 'business', ['financial plan', 'allowance'], ['overspend']],
  ['inspection', 'noun', 'B2', 3, 'a careful check to see whether something meets a standard', '\u68c0\u67e5\uff1b\u68c0\u9a8c', 'engineering', 'engineering', ['check', 'review'], ['neglect']],
  ['approval', 'noun', 'B2', 3, 'permission or agreement that something is acceptable', '\u6279\u51c6\uff1b\u8ba4\u53ef', 'business', 'business', ['permission', 'acceptance'], ['rejection']],
  ['grant', 'verb', 'B2', 3, 'to formally give permission, money, or a right', '\u6388\u4e88\uff1b\u6279\u51c6', 'business', 'business', ['allow', 'provide'], ['deny']],
  ['assumption', 'noun', 'B2', 3, 'an idea accepted as true without complete proof', '\u5047\u5b9a', 'reasoning', 'academic', ['belief', 'premise'], ['proof']],
  ['brief', 'adjective', 'B1', 2, 'short in time or length', '\u7b80\u77ed\u7684', 'communication', 'daily', ['short', 'concise'], ['long']],
  ['capacity', 'noun', 'B2', 3, 'the amount something can hold or do', '\u5bb9\u91cf\uff1b\u80fd\u529b', 'systems', 'academic', ['ability', 'volume'], ['limit']],
  ['capture', 'verb', 'B1', 2, 'to catch, record, or express something clearly', '\u6355\u6349\uff1b\u8bb0\u5f55', 'technology', 'technology', ['record', 'catch'], ['release']],
  ['cooperate', 'verb', 'B1', 2, 'to work together with others toward a goal', '\u5408\u4f5c', 'teamwork', 'daily', ['collaborate', 'assist'], ['compete']],
  ['cope', 'verb', 'B2', 3, 'to manage a difficult situation', '\u5e94\u5bf9', 'daily challenge', 'daily', ['manage', 'handle'], ['surrender']],
  ['delay', 'noun', 'B1', 2, 'a period of waiting longer than expected', '\u5ef6\u8bef\uff1b\u63a8\u8fdf', 'time', 'daily', ['postponement', 'pause'], ['advance']],
  ['deliver', 'verb', 'B1', 2, 'to bring, provide, or complete something promised', '\u4ea4\u4ed8\uff1b\u9012\u9001', 'project work', 'business', ['provide', 'send'], ['withhold']],
  ['display', 'verb', 'B1', 2, 'to show information or an object clearly', '\u663e\u793a\uff1b\u5c55\u793a', 'technology', 'technology', ['show', 'present'], ['hide']],
  ['efficient', 'adjective', 'B2', 3, 'working well without wasting time or energy', '\u9ad8\u6548\u7684', 'productivity', 'business', ['productive', 'effective'], ['wasteful']],
  ['engage', 'verb', 'B2', 3, 'to become involved or hold attention', '\u53c2\u4e0e\uff1b\u5438\u5f15', 'learning', 'education', ['involve', 'interest'], ['detach']],
  ['dashboard', 'noun', 'B2', 3, 'a screen or panel that summarizes important information', '\u4eea\u8868\u677f\uff1b\u4fe1\u606f\u9762\u677f', 'technology', 'technology', ['panel', 'display'], ['hidden log']],
  ['eligible', 'adjective', 'B2', 3, 'allowed or qualified to do or receive something', '\u6709\u8d44\u683c\u7684', 'rules', 'business', ['qualified', 'permitted'], ['ineligible']],
  ['deadline', 'noun', 'B1', 2, 'the latest time by which work must be finished', '\u622a\u6b62\u65e5\u671f', 'planning', 'business', ['due date', 'limit'], ['extension']],
  ['foundation', 'noun', 'B1', 2, 'the basic support or starting point for something', '\u57fa\u7840', 'learning', 'education', ['base', 'groundwork'], ['surface']],
  ['framework', 'noun', 'B2', 3, 'a structure of ideas or rules that supports work', '\u6846\u67b6', 'organization', 'academic', ['structure', 'system'], ['chaos']],
  ['frequent', 'adjective', 'B1', 2, 'happening often', '\u9891\u7e41\u7684', 'time', 'daily', ['common', 'regular'], ['rare']],
  ['guideline', 'noun', 'B2', 3, 'advice or a rule that helps people act correctly', '\u6307\u5357\uff1b\u51c6\u5219', 'rules', 'business', ['rule', 'instruction'], ['confusion']],
  ['highlight', 'verb', 'B1', 2, 'to make something easy to notice', '\u5f3a\u8c03\uff1b\u7a81\u51fa', 'communication', 'academic', ['emphasize', 'mark'], ['hide']],
  ['illustrate', 'verb', 'B2', 3, 'to explain something with an example or picture', '\u8bf4\u660e\uff1b\u4e3e\u4f8b', 'communication', 'education', ['explain', 'show'], ['obscure']],
  ['insight', 'noun', 'B2', 3, 'a clear understanding of a situation or idea', '\u6d1e\u5bdf\uff1b\u89c1\u89e3', 'thinking', 'academic', ['understanding', 'perception'], ['confusion']],
  ['distribution', 'noun', 'B2', 3, 'the way something is shared, spread, or delivered', '\u5206\u5e03\uff1b\u5206\u914d', 'systems', 'business', ['spread', 'delivery'], ['collection']],
  ['draft', 'noun', 'B1', 2, 'an early version of writing, a plan, or a design', '\u8349\u7a3f\uff1b\u521d\u7a3f', 'writing', 'education', ['version', 'outline'], ['final copy']],
  ['launch', 'verb', 'B1', 2, 'to start a project, product, or activity', '\u542f\u52a8\uff1b\u53d1\u5e03', 'project work', 'business', ['start', 'release'], ['stop']],
  ['layer', 'noun', 'B1', 2, 'one level or sheet among several', '\u5c42', 'systems', 'technology', ['level', 'tier'], ['whole']],
  ['logic', 'noun', 'B2', 3, 'clear reasoning that connects ideas', '\u903b\u8f91', 'reasoning', 'academic', ['reasoning', 'sense'], ['nonsense']],
  ['manual', 'adjective', 'B1', 2, 'done by hand or controlled by a person', '\u624b\u52a8\u7684', 'work', 'business', ['hand-operated', 'physical'], ['automatic']],
  ['measure', 'verb', 'B1', 2, 'to find size, amount, or level', '\u6d4b\u91cf\uff1b\u8861\u91cf', 'evaluation', 'academic', ['calculate', 'assess'], ['guess']],
  ['monitor', 'verb', 'B2', 3, 'to watch and check progress or condition over time', '\u76d1\u6d4b\uff1b\u8ddf\u8e2a', 'project work', 'technology', ['track', 'observe'], ['ignore']],
  ['economy', 'noun', 'B2', 3, 'the system of producing, using, and exchanging money or goods', '\u7ecf\u6d4e', 'society', 'business', ['market', 'system'], ['waste']],
  ['obstacle', 'noun', 'B2', 3, 'something that blocks progress', '\u969c\u788d', 'problem solving', 'daily', ['barrier', 'difficulty'], ['aid']],
  ['environment', 'noun', 'B1', 2, 'the conditions or surroundings in which something exists', '\u73af\u5883', 'daily life', 'daily', ['surroundings', 'setting'], ['vacuum']],
  ['output', 'noun', 'B2', 3, 'the result produced by a person, system, or machine', '\u8f93\u51fa\uff1b\u4ea7\u51fa', 'technology', 'technology', ['result', 'product'], ['input']],
  ['overall', 'adjective', 'B1', 2, 'considering everything together', '\u603b\u4f53\u7684', 'analysis', 'academic', ['general', 'total'], ['partial']],
  ['participation', 'noun', 'B1', 2, 'the act of taking part in an activity', '\u53c2\u4e0e', 'teamwork', 'education', ['involvement', 'engagement'], ['absence']],
  ['pattern', 'noun', 'B1', 2, 'a repeated form or arrangement', '\u6a21\u5f0f\uff1b\u89c4\u5f8b', 'analysis', 'academic', ['model', 'design'], ['randomness']],
  ['perspective', 'noun', 'B2', 3, 'a way of seeing or thinking about something', '\u89c6\u89d2\uff1b\u89c2\u70b9', 'thinking', 'academic', ['viewpoint', 'angle'], ['blindness']],
  ['potential', 'adjective', 'B2', 3, 'possible in the future but not yet certain', '\u6f5c\u5728\u7684', 'future thinking', 'academic', ['possible', 'likely'], ['impossible']],
  ['priority', 'noun', 'B2', 3, 'something considered more important than others', '\u4f18\u5148\u4e8b\u9879', 'planning', 'business', ['importance', 'preference'], ['afterthought']],
  ['procedure', 'noun', 'B2', 3, 'an ordered way to do something', '\u6b65\u9aa4\uff1b\u7a0b\u5e8f', 'process', 'business', ['process', 'method'], ['disorder']],
  ['project', 'noun', 'B1', 2, 'a planned piece of work with a goal', '\u9879\u76ee', 'project work', 'business', ['task', 'assignment'], ['routine']],
  ['quality', 'noun', 'B1', 2, 'how good or useful something is', '\u8d28\u91cf\uff1b\u54c1\u8d28', 'evaluation', 'business', ['standard', 'value'], ['defect']],
  ['range', 'noun', 'B1', 2, 'the distance or variety between limits', '\u8303\u56f4', 'measurement', 'academic', ['scope', 'span'], ['point']],
  ['reliable', 'adjective', 'B2', 3, 'able to be trusted to work well or be true', '\u53ef\u9760\u7684', 'trust', 'business', ['dependable', 'trustworthy'], ['unreliable']],
  ['remote', 'adjective', 'B1', 2, 'far away or done from another place', '\u8fdc\u7a0b\u7684\uff1b\u504f\u8fdc\u7684', 'digital life', 'technology', ['distant', 'online'], ['near']],
  ['resolve', 'verb', 'B2', 3, 'to solve a problem or make a decision firm', '\u89e3\u51b3\uff1b\u51b3\u5b9a', 'problem solving', 'daily', ['solve', 'settle'], ['complicate']],
  ['sequence', 'noun', 'B2', 3, 'a set of things arranged in order', '\u987a\u5e8f\uff1b\u5e8f\u5217', 'process', 'academic', ['order', 'series'], ['mix']],
  ['stable', 'adjective', 'B1', 2, 'not likely to change suddenly', '\u7a33\u5b9a\u7684', 'systems', 'academic', ['steady', 'secure'], ['unstable']],
  ['status', 'noun', 'B1', 2, 'the current state or position of something', '\u72b6\u6001\uff1b\u5730\u4f4d', 'project work', 'business', ['condition', 'position'], ['unknown']],
  ['summary', 'noun', 'B1', 2, 'a short version of the main points', '\u6458\u8981\uff1b\u603b\u7ed3', 'communication', 'academic', ['overview', 'brief'], ['detail']],
  ['feedback', 'noun', 'B1', 2, 'comments or information used to improve future work', '\u53cd\u9988', 'learning progress', 'education', ['response', 'comment'], ['silence']],
  ['target', 'noun', 'B1', 2, 'a goal or object someone aims at', '\u76ee\u6807', 'planning', 'business', ['goal', 'aim'], ['distraction']],
  ['temporary', 'adjective', 'B1', 2, 'lasting for only a limited time', '\u4e34\u65f6\u7684', 'time', 'daily', ['short-term', 'brief'], ['permanent']],
  ['topic', 'noun', 'A2', 1, 'a subject people talk or write about', '\u8bdd\u9898\uff1b\u4e3b\u9898', 'communication', 'daily', ['subject', 'theme'], ['silence']],
  ['track', 'verb', 'B1', 2, 'to follow progress or movement over time', '\u8ddf\u8e2a', 'project work', 'technology', ['monitor', 'trace'], ['lose']],
  ['trend', 'noun', 'B2', 3, 'a general direction of change', '\u8d8b\u52bf', 'analysis', 'academic', ['direction', 'pattern'], ['exception']],
  ['update', 'verb', 'A2', 1, 'to make information or a system current', '\u66f4\u65b0', 'technology', 'technology', ['refresh', 'revise'], ['outdate']],
  ['utility', 'noun', 'C1', 4, 'practical usefulness or a useful service', '\u5b9e\u7528\u6027\uff1b\u516c\u7528\u670d\u52a1', 'technology', 'technology', ['usefulness', 'service'], ['uselessness']],
  ['verify', 'verb', 'B2', 3, 'to check that something is true or correct', '\u9a8c\u8bc1\uff1b\u6838\u5b9e', 'evaluation', 'academic', ['confirm', 'check'], ['falsify']],
  ['version', 'noun', 'B1', 2, 'one form of something that may have other forms', '\u7248\u672c', 'technology', 'technology', ['edition', 'form'], ['original']],
  ['visible', 'adjective', 'B1', 2, 'able to be seen or noticed', '\u53ef\u89c1\u7684', 'observation', 'daily', ['seen', 'noticeable'], ['hidden']],
  ['workflow', 'noun', 'C1', 4, 'the ordered steps used to complete work', '\u5de5\u4f5c\u6d41\u7a0b', 'project work', 'business', ['process', 'pipeline'], ['disorder']],
  ['yield', 'verb', 'C1', 4, 'to produce a result or give way under pressure', '\u4ea7\u751f\uff1b\u8ba9\u6b65', 'cause and effect', 'academic', ['produce', 'give'], ['resist']],
  ['accuracy', 'noun', 'B2', 3, 'the quality of being correct and exact', '\u51c6\u786e\u6027', 'precision', 'academic', ['precision', 'correctness'], ['error']],
  ['adaptation', 'noun', 'B2', 3, 'a change made to fit a new situation', '\u9002\u5e94\uff1b\u6539\u7f16', 'change', 'academic', ['adjustment', 'change'], ['resistance']],
  ['agency', 'noun', 'C1', 4, 'the ability to act or make choices', '\u884c\u52a8\u80fd\u529b\uff1b\u673a\u6784', 'society', 'academic', ['power', 'organization'], ['helplessness']],
  ['alignment', 'noun', 'C1', 4, 'agreement or correct arrangement between parts', '\u5bf9\u9f50\uff1b\u4e00\u81f4', 'systems', 'business', ['agreement', 'arrangement'], ['misalignment']],
  ['analogy', 'noun', 'C1', 4, 'a comparison that explains an idea by similarity', '\u7c7b\u6bd4', 'reasoning', 'academic', ['comparison', 'parallel'], ['difference']],
  ['architecture', 'noun', 'C1', 4, 'the planned structure of a building, system, or idea', '\u67b6\u6784\uff1b\u5efa\u7b51', 'systems', 'technology', ['structure', 'design'], ['disorder']],
  ['benchmark', 'noun', 'C1', 4, 'a standard used to compare performance', '\u57fa\u51c6\uff1b\u6807\u6746', 'evaluation', 'business', ['standard', 'reference'], ['guess']],
  ['indicator', 'noun', 'B2', 3, 'a sign or measurement that shows a condition or trend', '\u6307\u6807\uff1b\u6307\u793a\u7269', 'analysis', 'academic', ['signal', 'measure'], ['guess']],
  ['deployment', 'noun', 'C1', 4, 'the act of putting a system or resource into use', '\u90e8\u7f72', 'technology', 'technology', ['release', 'rollout'], ['withdrawal']],
  ['diagnosis', 'noun', 'C1', 4, 'the act of identifying the cause of a problem', '\u8bca\u65ad\uff1b\u5224\u65ad', 'problem solving', 'academic', ['identification', 'analysis'], ['confusion']],
  ['iteration', 'noun', 'C1', 4, 'one repeated cycle in a process of improvement', '\u8fed\u4ee3', 'process', 'technology', ['cycle', 'revision'], ['finality']],
  ['optimization', 'noun', 'C1', 4, 'the process of making something work as well as possible', '\u4f18\u5316', 'technology', 'technology', ['improvement', 'refinement'], ['waste']],
  ['parameter', 'noun', 'C1', 4, 'a value or limit that shapes how a system works', '\u53c2\u6570', 'technology', 'technology', ['setting', 'variable'], ['constant']],
  ['protocol', 'noun', 'C1', 4, 'a rule system for communication or procedure', '\u534f\u8bae\uff1b\u89c4\u7a0b', 'technology', 'technology', ['rule', 'standard'], ['improvisation']],
  ['scalable', 'adjective', 'C1', 4, 'able to grow or handle more demand', '\u53ef\u6269\u5c55\u7684', 'technology', 'technology', ['expandable', 'flexible'], ['limited']],
  ['heritage', 'noun', 'B2', 3, 'traditions, history, or qualities passed from the past', '\u9057\u4ea7\uff1b\u4f20\u7edf', 'culture', 'academic', ['tradition', 'legacy'], ['novelty']],
  ['initiative', 'noun', 'B2', 3, 'a new action or plan started to solve a problem', '\u5021\u8bae\uff1b\u4e3b\u52a8\u884c\u52a8', 'project work', 'business', ['campaign', 'plan'], ['inaction']],
]

export const CORE_WORDS_500_BATCH_2: DictionaryImportWord[] = ROWS.map(makeEntry)

export const CORE_WORDS_500_BATCH_2_COUNT = CORE_WORDS_500_BATCH_2.length
