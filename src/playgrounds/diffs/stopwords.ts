const pronouns = [
  'all', 'another', 'any', 'anybody', 'anyone', 'anything', 'as', 'aught',
  'both', 'each', 'each other', 'either', 'enough', 'everybody', 'everyone',
  'everything', 'few', 'he', 'her', 'hers', 'herself', 'him', 'himself', 'his',
  'i', 'idem', 'it', 'its', 'itself', 'many', 'me', 'mine', 'most', 'my',
  'myself', 'naught', 'neither', 'nobody', 'none', 'nothing', 'nought', 'one',
  'other', 'others', 'ought', 'our', 'ours', 'ourself', 'ourselves', 'several',
  'she', 'some', 'somebody', 'someone', 'something', 'somewhat', 'such',
  'suchlike', 'that', 'thee', 'their', 'theirs', 'theirself', 'theirselves',
  'them', 'themself', 'themselves', 'there', 'these', 'they', 'thine', 'this',
  'those', 'thou', 'thy', 'thyself', 'us', 'we', 'what', 'whatever', 'whatnot',
  'whatsoever', 'whence', 'where', 'whereby', 'wherefrom', 'wherein',
  'whereinto', 'whereof', 'whereon', 'wherever', 'wheresoever', 'whereto',
  'whereunto', 'wherewith', 'wherewithal', 'whether', 'which', 'whichever',
  'whichsoever', 'who', 'whoever', 'whom', 'whomever', 'whomso', 'whomsoever',
  'whose', 'whosever', 'whosesoever', 'whoso', 'whosoever', 'ye', 'yon',
  'yonder', 'you', 'your', 'yours', 'yourself', 'yourselves',
];

const articles = ['a', 'an', 'the'];

const prepositions = [
  'aboard', 'about', 'above', 'across', 'after', 'against', 'along', 'amid',
  'among', 'anti', 'around', 'as', 'at', 'before', 'behind', 'below', 'beneath',
  'beside', 'besides', 'between', 'beyond', 'but', 'by', 'concerning',
  'considering', 'despite', 'down', 'during', 'except', 'excepting', 'excluding',
  'following', 'for', 'from', 'in', 'inside', 'into', 'like', 'minus', 'near',
  'of', 'off', 'on', 'onto', 'opposite', 'outside', 'over', 'past', 'per',
  'plus', 'regarding', 'round', 'save', 'since', 'than', 'through', 'to',
  'toward', 'towards', 'under', 'underneath', 'unlike', 'until', 'up', 'upon',
  'versus', 'via', 'with', 'within', 'without',
];

const conjunctions = ['for', 'and', 'nor', 'but', 'or', 'yet', 'so'];

const verbs = [
  'is', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
  'done', 'need', 'needed', 'get', 'got', 'gotten', 'let',
];

export const STOPWORDS = new Set<string>([
  ...pronouns,
  ...articles,
  ...prepositions,
  ...conjunctions,
  ...verbs,
]);

export function isStopword(word: string): boolean {
  const clean = word.replace(/['’].*/i, '').toLowerCase();
  return STOPWORDS.has(clean);
}
