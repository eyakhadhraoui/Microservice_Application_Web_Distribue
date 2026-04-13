import { Injectable } from '@angular/core';

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  date: Date;
}

/**
 * Réponses prédéfinies pour le chatbot d'aide aux tests de néphrologie pédiatrique.
 * Correspondance par mots-clés (insensible à la casse, accents ignorés).
 */
const KNOWLEDGE: { keywords: string[]; response: string }[] = [
  {
    keywords: ['créatinine', 'creatinine', 'creatininemie', 'créatininémie'],
    response: 'La créatininémie mesure la fonction rénale. Elle reflète la capacité des reins à filtrer le sang. Chez l\'enfant, les normes varient avec l\'âge et la taille. Une élévation peut indiquer une insuffisance rénale ou une déshydratation. C\'est un test clé en néphrologie pédiatrique.'
  },
  {
    keywords: ['nfs', 'numération', 'sang', 'globules', 'hématologie'],
    response: 'La NFS (Numération Formule Sanguine) évalue les globules rouges, blancs et les plaquettes. En néphro pédiatrique, on la surveille notamment pour l\'anémie (baisse d\'hémoglobine) fréquente en insuffisance rénale chronique, et pour les effets de certains traitements (corticoïdes, immunosuppresseurs).'
  },
  {
    keywords: ['protéinurie', 'proteinurie', 'albumine', 'urine'],
    response: 'La protéinurie mesure la présence de protéines dans les urines. En néphrologie pédiatrique, elle est essentielle pour le syndrome néphrotique (perte massive de protéines). On surveille aussi l\'albuminurie. Une protéinurie élevée peut indiquer une poussée ou une rechute à contrôler.'
  },
  {
    keywords: ['albuminémie', 'albumine', 'albumine sang'],
    response: 'L\'albuminémie mesure l\'albumine dans le sang. Dans le syndrome néphrotique, elle peut chuter car l\'albumine est perdue dans les urines. Une baisse importante est un signe d\'activité de la maladie. Les valeurs normales chez l\'enfant sont proches de l\'adulte (environ 35–50 g/L).'
  },
  {
    keywords: ['phosphore', 'phosphorémie', 'phosphatémie'],
    response: 'La phosphorémie (phosphore sanguin) est surveillée en insuffisance rénale chronique. Elle peut s\'élever quand les reins ne l\'éliminent plus correctement. Un excès de phosphore chez l\'enfant peut affecter les os et la croissance. Un régime et parfois des chélateurs sont utilisés.'
  },
  {
    keywords: ['calcémie', 'calcium', 'calcium sang'],
    response: 'La calcémie (calcium sanguin) est souvent dosée avec la phosphorémie et la vitamine D en néphro pédiatrique. Les reins participent à son équilibre. En insuffisance rénale, des troubles du calcium et du phosphore peuvent survenir et nécessitent un suivi régulier.'
  },
  {
    keywords: ['urée', 'uree'],
    response: 'L\'urée est un déchet du métabolisme des protéines, éliminé par les reins. Une élévation peut refléter une baisse de la fonction rénale ou une déshydratation. Elle est souvent interprétée avec la créatinine pour évaluer la fonction rénale de l\'enfant.'
  },
  {
    keywords: ['ionogramme', 'sodium', 'potassium', 'kaliémie', 'natrémie'],
    response: 'L\'ionogramme sanguin mesure sodium, potassium, chlore et bicarbonates. En néphrologie pédiatrique, il est important pour surveiller l\'équilibre hydro-électrolytique, surtout en cas de diurétiques, de vomissements ou d\'insuffisance rénale. Le potassium peut s\'élever en IRC.'
  },
  {
    keywords: ['crp', 'inflammation', 'infection'],
    response: 'La CRP (Protéine C Réactive) est un marqueur d\'inflammation ou d\'infection. Elle peut être demandée pour distinguer une poussée inflammatoire (néphrite) d\'une simple infection, ou pour surveiller une infection urinaire ou une greffe.'
  },
  {
    keywords: ['hématurie', 'hematurie', 'sang urine', 'globules rouges urine'],
    response: 'L\'hématurie correspond à la présence de sang (globules rouges) dans les urines. Elle peut être visible ou microscopique. En pédiatrie, les causes vont de l\'infection urinaire à la glomérulonéphrite. Un suivi néphrologique est souvent nécessaire si elle persiste.'
  },
  {
    keywords: ['culture urine', 'ecbu', 'infection urinaire', 'bactérie'],
    response: 'La culture d\'urine (ECBU) recherche une infection urinaire. En néphro pédiatrique, les infections urinaires à répétition peuvent faire craindre un reflux ou une malformation. Un traitement adapté et un suivi sont importants pour protéger les reins de l\'enfant.'
  },
  {
    keywords: ['electrophorèse', 'electrophorese', 'protéines sang'],
    response: 'L\'électrophorèse des protéines sépare les différentes protéines du sang. En néphrologie, elle aide au diagnostic de certaines glomérulonéphrites ou du syndrome néphrotique. Elle peut mettre en évidence une anomalie des immunoglobulines.'
  },
  {
    keywords: ['bilan hépatique', 'hépatique', 'foie', 'transaminases'],
    response: 'Le bilan hépatique (transaminases, etc.) est souvent surveillé car certains traitements en néphro (immunosuppresseurs, corticoïdes) peuvent affecter le foie. Il est courant de le prescrire avant et pendant un traitement au long cours.'
  },
  {
    keywords: ['glycémie', 'glucose', 'sucre sang'],
    response: 'La glycémie mesure le glucose dans le sang. Elle peut être surveillée sous corticoïdes (risque d\'élévation du sucre) ou en cas de dialyse. En néphro pédiatrique, elle fait partie du bilan de surveillance selon le traitement.'
  },
  {
    keywords: ['hémoglobine', 'hemoglobine', 'anémie', 'anemie'],
    response: 'L\'hémoglobine reflète la capacité du sang à transporter l\'oxygène. L\'anémie (baisse d\'hémoglobine) est fréquente en insuffisance rénale chronique chez l\'enfant. Elle peut nécessiter du fer ou de l\'érythropoïétine (EPO) selon le avis du néphrologue.'
  },
  {
    keywords: ['quand', 'quels tests', 'quelle fréquence', 'fréquence', 'suivi'],
    response: 'La fréquence des tests dépend du diagnostic et du traitement. En syndrome néphrotique ou glomérulonéphrite, les tests (créatinine, protéinurie, albuminémie, NFS, etc.) sont souvent rapprochés en phase active, puis espacés en rémission. Votre médecin adapte le rythme à chaque enfant.'
  },
  {
    keywords: ['norme', 'normale', 'valeur normale', 'référence', 'enfant'],
    response: 'Les valeurs de référence des tests varient selon l\'âge, le poids et la taille de l\'enfant (notamment pour la créatinine). Seul le médecin peut interpréter un résultat dans le contexte de votre enfant. Les laboratoires indiquent souvent des fourchettes par âge.'
  },
  {
    keywords: ['syndrome néphrotique', 'néphrotique', 'rechute', 'corticoïde'],
    response: 'Dans le syndrome néphrotique de l\'enfant, on surveille régulièrement la protéinurie (bandelette ou dosage), l\'albuminémie, la créatinine et la NFS. En cas de rechute, la protéinurie redevient positive. Les corticoïdes peuvent affecter la glycémie et le bilan hépatique, d\'où des contrôles adaptés.'
  },
  {
    keywords: ['insuffisance rénale', 'irc', 'chronique', 'dialyse'],
    response: 'En insuffisance rénale chronique pédiatrique, le suivi biologique inclut créatinine, urée, ionogramme, phosphorémie, calcémie, hémoglobine, bilan phospho-calcique et souvent bilan nutritionnel. La fréquence est définie par le néphrologue selon le stade et le traitement.'
  },
  {
    keywords: ['bonjour', 'salut', 'aide', 'help', 'quoi', 'comment'],
    response: 'Bonjour ! Je suis l\'assistant KidneyCare pour les tests de néphrologie pédiatrique. Vous pouvez me demander à quoi servent les tests (créatinine, NFS, protéinurie, etc.), quand les faire, ou ce que signifient les résultats. Posez votre question en quelques mots.'
  }
];

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable({ providedIn: 'root' })
export class NephroChatbotService {

  getReply(userInput: string): string {
    const normalized = normalize(userInput);
    if (!normalized) return 'Pouvez-vous préciser votre question sur les tests de néphrologie pédiatrique ?';

    for (const entry of KNOWLEDGE) {
      const hasMatch = entry.keywords.some(kw => normalized.includes(normalize(kw)));
      if (hasMatch) return entry.response;
    }

    return 'Je n\'ai pas trouvé de réponse précise pour cette question. Vous pouvez reformuler ou demander par exemple : "À quoi sert la créatinine ?", "Quels tests pour le syndrome néphrotique ?" ou "Quand faire les tests ?". Pour toute interprétation de résultats, consultez votre néphrologue ou pédiatre.';
  }

  getWelcomeMessage(): string {
    return 'Bonjour ! Je suis l\'assistant KidneyCare pour les tests de néphrologie pédiatrique. Posez-moi une question, par exemple : "À quoi sert la créatinine ?", "Protéinurie", "Quels tests en suivi ?"';
  }
}
