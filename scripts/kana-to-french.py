"""
Convert Japanese katakana wine names to French/English
Uses:
1. EN_MAP from Beverage Compass (1252 direct matches)
2. Comprehensive katakana→French wine vocabulary (word-by-word)
3. Updates wc_beverages: name→French, name_kana→katakana
"""
import json, re, unicodedata, sys, os
try:
    import requests
except ImportError:
    os.system(f'{sys.executable} -m pip install requests')
    import requests

# --- Load EN_MAP ---
with open(r'C:\Users\RyojiHayashi\Downloads\en_map_extract.json', 'r', encoding='utf-8') as f:
    EN_MAP = json.load(f)

# --- Comprehensive katakana→French wine vocabulary ---
# Sorted by length (longest first) to prioritize multi-word matches
WINE_VOCAB = {
    # === REGIONS / APPELLATIONS ===
    'ヴォーヌ・ロマネ': 'Vosne-Romanée',
    'ニュイ・サン・ジョルジュ': 'Nuits-Saint-Georges',
    'モレ・サン・ドニ': 'Morey-Saint-Denis',
    'シャンボール・ミュジニー': 'Chambolle-Musigny',
    'ジュヴレ・シャンベルタン': 'Gevrey-Chambertin',
    'アロース・コルトン': 'Aloxe-Corton',
    'サヴィニー・レ・ボーヌ': 'Savigny-lès-Beaune',
    'ペルナン・ヴェルジュレス': 'Pernand-Vergelesses',
    'ショレイ・レ・ボーヌ': 'Chorey-lès-Beaune',
    'オーセイ・デュレス': 'Auxey-Duresses',
    'サン・ロマン': 'Saint-Romain',
    'シャサーニュ・モンラッシェ': 'Chassagne-Montrachet',
    'ピュリニー・モンラッシェ': 'Puligny-Montrachet',
    'サン・ヴェラン': 'Saint-Véran',
    'プイイ・フュイッセ': 'Pouilly-Fuissé',
    'プイイ・フュメ': 'Pouilly-Fumé',
    'プイイ・ロシェ': 'Pouilly-Loché',
    'マコン・ヴィラージュ': 'Mâcon-Villages',
    'サン・トーバン': 'Saint-Aubin',
    'サントネイ': 'Santenay',
    'サン・ジョセフ': 'Saint-Joseph',
    'サン・ニコラ・ド・ブルグイユ': 'Saint-Nicolas-de-Bourgueil',
    'サン・ジュリアン': 'Saint-Julien',
    'サン・テステフ': 'Saint-Estèphe',
    'サンテミリオン': 'Saint-Émilion',
    'シャトーヌフ・デュ・パプ': 'Châteauneuf-du-Pape',
    'コート・デュ・ローヌ': 'Côtes du Rhône',
    'コート・ド・ニュイ': 'Côte de Nuits',
    'コート・ド・ボーヌ': 'Côte de Beaune',
    'オート・コート・ド・ニュイ': 'Hautes-Côtes de Nuits',
    'オート・コート・ド・ボーヌ': 'Hautes-Côtes de Beaune',
    'コート・シャロネーズ': 'Côte Chalonnaise',
    'コート・ド・プロヴァンス': 'Côtes de Provence',
    'コート・ロティ': 'Côte-Rôtie',
    'エルミタージュ': 'Hermitage',
    'クローズ・エルミタージュ': 'Crozes-Hermitage',
    'ブルゴーニュ': 'Bourgogne',
    'ボルドー': 'Bordeaux',
    'アルザス': 'Alsace',
    'シャンパーニュ': 'Champagne',
    'シャンパン': 'Champagne',
    'ラングドック': 'Languedoc',
    'ルーション': 'Roussillon',
    'ロワール': 'Loire',
    'ジュラ': 'Jura',
    'サヴォワ': 'Savoie',
    'プロヴァンス': 'Provence',
    'コルス': 'Corse',
    'カリフォルニア': 'California',
    'オレゴン': 'Oregon',
    'トスカーナ': 'Toscana',
    'ピエモンテ': 'Piemonte',
    'ヴェネト': 'Veneto',
    'ボージョレ': 'Beaujolais',
    'マルサネ': 'Marsannay',
    'フィクサン': 'Fixin',
    'ポマール': 'Pommard',
    'ヴォルネイ': 'Volnay',
    'ムルソー': 'Meursault',
    'モンテリ': 'Monthélie',
    'マランジュ': 'Maranges',
    'リュリー': 'Rully',
    'メルキュレイ': 'Mercurey',
    'ジヴリ': 'Givry',
    'モンタニー': 'Montagny',
    'マコン': 'Mâcon',
    'シャブリ': 'Chablis',
    'ボーヌ': 'Beaune',
    'コルトン': 'Corton',
    'ローヌ': 'Rhône',
    'ソーテルヌ': 'Sauternes',
    'ポイヤック': 'Pauillac',
    'マルゴー': 'Margaux',
    'ペサック': 'Pessac',
    'グラーヴ': 'Graves',
    'メドック': 'Médoc',
    'ポムロール': 'Pomerol',
    'フロンサック': 'Fronsac',
    'モーゼル': 'Mosel',
    'ファルツ': 'Pfalz',
    'ラインガウ': 'Rheingau',
    'バーデン': 'Baden',
    'コンドリュー': 'Condrieu',
    'コルナス': 'Cornas',
    'サンセール': 'Sancerre',
    'ヴーヴレイ': 'Vouvray',
    'ミュスカデ': 'Muscadet',
    'ブルグイユ': 'Bourgueil',
    'シノン': 'Chinon',
    'ソミュール': 'Saumur',
    'アンジュー': 'Anjou',
    'アンジュ': 'Anjou',
    'バンドール': 'Bandol',
    'バニュルス': 'Banyuls',
    'コリウール': 'Collioure',
    'カオール': 'Cahors',
    'マディラン': 'Madiran',
    'ジュランソン': 'Jurançon',
    'イルレギー': 'Irouléguy',
    'クレマン': 'Crémant',
    'ペイドック': "Pays d'Oc",

    # === GRAND CRU VINEYARDS ===
    'シャンベルタン': 'Chambertin',
    'シャンベルタン・クロ・ド・ベーズ': 'Chambertin Clos de Bèze',
    'クロ・ド・ベーズ': 'Clos de Bèze',
    'グリオット・シャンベルタン': 'Griotte-Chambertin',
    'シャペル・シャンベルタン': 'Chapelle-Chambertin',
    'マジ・シャンベルタン': 'Mazis-Chambertin',
    'マゾワイエール・シャンベルタン': 'Mazoyères-Chambertin',
    'リュショット・シャンベルタン': 'Ruchottes-Chambertin',
    'シャルム・シャンベルタン': 'Charmes-Chambertin',
    'ラトリシエール・シャンベルタン': 'Latricières-Chambertin',
    'ミュジニー': 'Musigny',
    'ボンヌ・マール': 'Bonnes-Mares',
    'クロ・ド・タール': 'Clos de Tart',
    'クロ・ド・ランブレイ': 'Clos des Lambrays',
    'クロ・サン・ドニ': 'Clos Saint-Denis',
    'クロ・ド・ラ・ロッシュ': 'Clos de la Roche',
    'ロマネ・コンティ': 'Romanée-Conti',
    'ラ・ターシュ': 'La Tâche',
    'リシュブール': 'Richebourg',
    'ロマネ・サン・ヴィヴァン': 'Romanée-Saint-Vivant',
    'グラン・エシェゾー': 'Grands Échézeaux',
    'エシェゾー': 'Échézeaux',
    'ラ・ロマネ': 'La Romanée',
    'ラ・グランド・リュ': 'La Grande Rue',
    'クロ・ド・ヴージョ': 'Clos de Vougeot',
    'コルトン・シャルルマーニュ': 'Corton-Charlemagne',
    'モンラッシェ': 'Montrachet',
    'バタール・モンラッシェ': 'Bâtard-Montrachet',
    'シュヴァリエ・モンラッシェ': 'Chevalier-Montrachet',
    'ビアンヴニュ・バタール・モンラッシェ': 'Bienvenues-Bâtard-Montrachet',
    'クリオ・バタール・モンラッシェ': 'Criots-Bâtard-Montrachet',

    # === 1ER CRU VINEYARDS ===
    'レ・ザムルーズ': 'Les Amoureuses',
    'レ・オードワ': 'Les Hauts Doix',
    'ラ・コンブ・ドルヴォー': 'La Combe d\'Orveau',
    'レ・ボーモン': 'Les Beaumonts',
    'レ・スショ': 'Les Suchots',
    'オー・マルコンソール': 'Aux Malconsorts',
    'レ・ブリュレ': 'Les Brûlées',
    'クロ・パラントゥ': 'Clos Parentoux',
    'オー・クロパラントゥ': 'Au Cros Parantoux',
    'レ・プティ・モン': 'Les Petits Monts',
    'レ・ショーム': 'Les Chaumes',
    'クロ・デ・レア': 'Clos des Réas',
    'オー・レニョ': 'Aux Reignots',
    'レ・サン・ジョルジュ': 'Les Saint-Georges',
    'レ・ヴォークラン': 'Les Vaucrains',
    'レ・カイユレ': 'Les Caillerets',
    'モンリュイザン': 'Monts Luisants',
    'レ・シャフォ': 'Les Chaffots',
    'レ・リュショ': 'Les Ruchots',
    'レ・ミヤンド': 'Les Millandes',
    'ラ・リオット': 'La Riotte',
    'レ・グルイヤンシュ': 'Les Gruenchers',
    'レ・グリュアンシュ': 'Les Gruenchers',
    'レ・ラヴォー': 'Les Lavaux',
    'レ・クロ': 'Les Clos',
    'レ・グレネ': 'Les Grenets',
    'レ・ペリエール': 'Les Perrières',
    'レ・ジュヌヴリエール': 'Les Genevrières',
    'レ・シャルム': 'Les Charmes',
    'レ・グット・ドール': "Les Gouttes d'Or",
    'レ・ブシェール': 'Les Bouchères',
    'レ・ポリュゾ': 'Les Poruzots',
    'レ・コンベット': 'Les Combettes',
    'レ・フォラティエール': 'Les Folatières',
    'レ・ピュセル': 'Les Pucelles',
    'クラヴォワヨン': 'Clavoillon',
    'レ・リュフェール': 'Les Referts',
    'ラ・ガレンヌ': 'La Garenne',
    'レ・ヴェルジュレス': 'Les Vergelesses',
    'レ・マルコネ': 'Les Marconnets',
    'レ・グレーヴ': 'Les Grèves',
    'レ・トゥーロン': 'Les Teurons',
    'ク・デ・ムーシュ': "Clos des Mouches",
    'クロ・デ・ムーシュ': 'Clos des Mouches',
    'クロ・デュ・ロワ': 'Clos du Roi',
    'レ・ルナルド': 'Les Renardes',
    'レ・ブレッサンド': 'Les Bressandes',
    'レ・プジェ': 'Les Pougets',
    'レ・グランド・ロリエール': 'Les Grandes Lolières',
    'プティ・シャペル': 'Petite Chapelle',
    'シャン・ペルドリ': 'Champs Perdrix',
    'レ・クラ': 'Les Cras',
    'レ・プリュリエ': 'Les Pruliers',
    'オー・ブド': 'Aux Boudots',
    'レ・ダモード': 'Les Damodes',
    'レ・ポレ・サン・ジョルジュ': 'Les Porêts-Saint-Georges',
    'クロ・デ・フォレ・サン・ジョルジュ': 'Clos des Forêts Saint-Georges',
    'モン・リュイザン': 'Monts Luisants',

    # === WINE TERMS ===
    'ブラン・ド・ブラン': 'Blanc de Blancs',
    'ブラン・ド・ノワール': 'Blanc de Noirs',
    'エクストラ・ブリュット': 'Extra Brut',
    'ブリュット・ナチュール': 'Brut Nature',
    'ブリュット': 'Brut',
    'ドゥミ・セック': 'Demi-Sec',
    'グラン・クリュ': 'Grand Cru',
    'プルミエ・クリュ': '1er Cru',
    'ヴィエイユ・ヴィーニュ': 'Vieilles Vignes',
    'キュヴェ': 'Cuvée',
    'クロ': 'Clos',
    'リューディ': 'Lieu-dit',
    'ドメーヌ': 'Domaine',
    'シャトー': 'Château',
    'メゾン': 'Maison',
    'ネゴシアン': 'Négociant',
    'ミレジム': 'Millésimé',
    'ミレジメ': 'Millésimé',
    'デゴルジュマン': 'Dégorgement',
    'デゴルジュ': 'Dégorgement',
    'アッサンブラージュ': 'Assemblage',
    'プレスティージュ': 'Prestige',
    'スペシャル': 'Spéciale',
    'レゼルヴ': 'Réserve',

    # === GRAPE VARIETIES ===
    'ピノ・ノワール': 'Pinot Noir',
    'ピノノワール': 'Pinot Noir',
    'シャルドネ': 'Chardonnay',
    'カベルネ・ソーヴィニョン': 'Cabernet Sauvignon',
    'メルロー': 'Merlot',
    'メルロ': 'Merlot',
    'ソーヴィニョン・ブラン': 'Sauvignon Blanc',
    'ゲヴュルツトラミネール': 'Gewurztraminer',
    'リースリング': 'Riesling',
    'シラー': 'Syrah',
    'グルナッシュ': 'Grenache',
    'ムールヴェードル': 'Mourvèdre',
    'ヴィオニエ': 'Viognier',
    'マルサンヌ': 'Marsanne',
    'ルーサンヌ': 'Roussanne',
    'ミュスカ': 'Muscat',
    'ミュスカデ': 'Muscadet',
    'ガメイ': 'Gamay',
    'ガメ': 'Gamay',
    'シュナン・ブラン': 'Chenin Blanc',
    'シュナン': 'Chenin',
    'サヴァニャン': 'Savagnin',
    'トゥルソー': 'Trousseau',
    'プールサール': 'Poulsard',
    'ネッビオーロ': 'Nebbiolo',
    'サンジョヴェーゼ': 'Sangiovese',
    'テンプラニーリョ': 'Tempranillo',
    'アリゴテ': 'Aligoté',
    'ピノ・グリ': 'Pinot Gris',
    'ピノ・ブラン': 'Pinot Blanc',
    'ピノ・ムニエ': 'Pinot Meunier',
    'マルベック': 'Malbec',
    'タナ': 'Tannat',
    'カリニャン': 'Carignan',
    'サンソー': 'Cinsault',

    # === COLOR / STYLE TERMS ===
    'ブラン': 'Blanc',
    'ルージュ': 'Rouge',
    'ロゼ': 'Rosé',
    'パストゥグラン': 'Passetoutgrains',
    'ヴァン・ジョーヌ': 'Vin Jaune',
    'ヴァン・ド・フランス': 'Vin de France',
    'ヴァン・ド・ペイ': 'Vin de Pays',
    'ヴァン・ムスー': 'Vin Mousseux',

    # === MORE COMPOUND ENTRIES ===
    'レ・フォラティエール': 'Les Folatières',
    'レ・コンベット': 'Les Combettes',
    'レ・スショ': 'Les Suchots',
    'レ・シュショ': 'Les Suchots',
    'ラ・コンブ・ブリュレ': 'La Combe Brûlée',
    'レ・グラン・スショ': 'Les Grands Suchots',
    'オー・クロパラントゥ': 'Au Cros Parantoux',
    'オー・レニョー': 'Aux Reignots',
    'オーマルコンソール': 'Aux Malconsorts',
    'レ・ショーメ': 'Les Chaumes',
    'サン・ジョルジュ': 'Saint-Georges',
    'サン・ドニ': 'Saint-Denis',
    'サン・ヴィヴァン': 'Saint-Vivant',
    'ブルゴーニュ・オート・コート・ド・ニュイ': 'Bourgogne Hautes-Côtes de Nuits',
    'ブルゴーニュ・オート・コート・ド・ボーヌ': 'Bourgogne Hautes-Côtes de Beaune',
    'コート・ド・ニュイ・ヴィラージュ': 'Côte de Nuits-Villages',
    'コート・ド・ボーヌ・ヴィラージュ': 'Côte de Beaune-Villages',
    'マール・ド・ブルゴーニュ': 'Marc de Bourgogne',
    'フィーヌ・ド・ブルゴーニュ': 'Fine de Bourgogne',
    'サント・オーバン': 'Saint-Aubin',
    'ラドワ・セリニー': 'Ladoix-Serrigny',
    'ブラン・ド・ノワール': 'Blanc de Noirs',
    'エクストラ・ブリュット': 'Extra Brut',
    'ブリュット・ナチュール': 'Brut Nature',
    'ヴィエイユ・ヴィーニュ': 'Vieilles Vignes',
    'グラン・クリュ': 'Grand Cru',
    'プルミエ・クリュ': '1er Cru',
    'ピノ・ノワール': 'Pinot Noir',
    'ピノノワール': 'Pinot Noir',
    'ピノ・グリ': 'Pinot Gris',
    'ピノ・ブラン': 'Pinot Blanc',
    'ピノ・ムニエ': 'Pinot Meunier',
    'カベルネ・ソーヴィニョン': 'Cabernet Sauvignon',
    'カベルネ・ソーヴィニヨン': 'Cabernet Sauvignon',
    'ソーヴィニョン・ブラン': 'Sauvignon Blanc',
    'シュナン・ブラン': 'Chenin Blanc',
    'ブラン・ド・ブラン': 'Blanc de Blancs',
    'コルトン・シャルルマーニュ': 'Corton-Charlemagne',
    'バタール・モンラッシェ': 'Bâtard-Montrachet',
    'シュヴァリエ・モンラッシェ': 'Chevalier-Montrachet',
    'クロ・ド・ヴージョ': 'Clos de Vougeot',
    'クロ・ド・タール': 'Clos de Tart',
    'クロ・ド・ランブレイ': 'Clos des Lambrays',
    'クロ・サン・ドニ': 'Clos Saint-Denis',
    'クロ・ド・ラ・ロッシュ': 'Clos de la Roche',
    'クロ・デ・レア': 'Clos des Réas',
    'クロ・デ・ムーシュ': 'Clos des Mouches',
    'クロ・デュ・ロワ': 'Clos du Roi',
    'クロ・パラントゥ': 'Clos Parentoux',
    'クロ・ド・ベーズ': 'Clos de Bèze',
    'レ・ザムルーズ': 'Les Amoureuses',
    'レ・ボーモン': 'Les Beaumonts',
    'レ・ブリュレ': 'Les Brûlées',
    'レ・プティ・モン': 'Les Petits Monts',
    'レ・ショーム': 'Les Chaumes',
    'オー・マルコンソール': 'Aux Malconsorts',
    'オー・レニョ': 'Aux Reignots',
    'レ・サン・ジョルジュ': 'Les Saint-Georges',
    'レ・ヴォークラン': 'Les Vaucrains',
    'レ・カイユレ': 'Les Caillerets',
    'レ・ペリエール': 'Les Perrières',
    'レ・ジュヌヴリエール': 'Les Genevrières',
    'レ・シャルム': 'Les Charmes',
    'レ・グット・ドール': "Les Gouttes d'Or",
    'レ・ポリュゾ': 'Les Poruzots',
    'レ・ピュセル': 'Les Pucelles',
    'レ・ヴェルジュレス': 'Les Vergelesses',
    'レ・マルコネ': 'Les Marconnets',
    'レ・グレーヴ': 'Les Grèves',
    'レ・トゥーロン': 'Les Teurons',
    'レ・ルナルド': 'Les Renardes',
    'レ・ブレッサンド': 'Les Bressandes',
    'レ・クラ': 'Les Cras',
    'レ・プリュリエ': 'Les Pruliers',
    'オー・ブド': 'Aux Boudots',
    'レ・ダモード': 'Les Damodes',
    'クロ・デ・フォレ・サン・ジョルジュ': 'Clos des Forêts Saint-Georges',
}

# Single-word entries (exact match only when segment is standalone)
SINGLE_VOCAB = {
    # Articles / prepositions
    'レ': 'Les', 'ラ': 'La', 'ル': 'Le', 'デ': 'des', 'デュ': 'du',
    'ド': 'de', 'エ': 'et', 'アン': 'En', 'オー': 'Aux', 'シュル': 'Sur',
    'スー': 'Sous', 'ドゥ': 'de', 'オ': 'Au',
    # Common wine terms
    'グラン': 'Grand', 'グランド': 'Grande', 'クリュ': 'Cru',
    'プルミエ': '1er', 'プレミエ': '1er', '1er': '1er',
    'エクストラ': 'Extra', 'キュヴェ': 'Cuvée',
    'ヴィラージュ': 'Villages', 'ヴィエイユ': 'Vieilles', 'ヴィーニュ': 'Vignes',
    'フィス': 'Fils', 'フレール': 'Frères', 'ペール': 'Père',
    'トラディション': 'Tradition', 'ナチュール': 'Nature',
    'モノポール': 'Monopole', 'クラシコ': 'Classico',
    'イニシャル': 'Initial', 'スペシャル': 'Spéciale',
    'プレスティージュ': 'Prestige', 'レゼルヴ': 'Réserve',
    'デゴルジュマン': 'Dégorgement', 'デゴルジュ': 'Dégorgement',
    'アッサンブラージュ': 'Assemblage', 'ミレジメ': 'Millésimé', 'ミレジム': 'Millésimé',
    'ヴィノテーク': 'Vinothèque',
    # Grape varieties
    'ピノ': 'Pinot', 'ノワール': 'Noir', 'ムニエ': 'Meunier',
    'カベルネ': 'Cabernet', 'ソーヴィニョン': 'Sauvignon', 'ソーヴィニヨン': 'Sauvignon',
    'シャルドネ': 'Chardonnay', 'ガメイ': 'Gamay', 'ガメ': 'Gamay',
    'シラー': 'Syrah', 'グルナッシュ': 'Grenache', 'ムールヴェードル': 'Mourvèdre',
    'ヴィオニエ': 'Viognier', 'リースリング': 'Riesling', 'アリゴテ': 'Aligoté',
    'サヴァニャン': 'Savagnin', 'トゥルソー': 'Trousseau', 'プールサール': 'Poulsard',
    'ネッビオーロ': 'Nebbiolo', 'サンジョヴェーゼ': 'Sangiovese',
    'メルロー': 'Merlot', 'メルロ': 'Merlot', 'マルベック': 'Malbec',
    # Colors / styles
    'ブラン': 'Blanc', 'ルージュ': 'Rouge', 'ロゼ': 'Rosé',
    'ロッソ': 'Rosso', 'ホワイト': 'White',
    # Place names (standalone)
    'ヴァン': 'Vin', 'フランス': 'France',
    'サン': 'Saint', 'モン': 'Mont',
    # Burgundy vineyards (standalone segments)
    'コート': 'Côte', 'オート': 'Hautes', 'コトー': 'Coteau',
    'プティ': 'Petit', 'プイィ': 'Pouilly', 'フュイッセ': 'Fuissé',
    'ヴージョ': 'Vougeot', 'フォレ': 'Forêts', 'ジャック': 'Jacques',
    'ジョルジュ': 'Georges', 'シェニョ': 'Cheignot',
    'モルジョ': 'Morgeot', 'マレシャル': 'Maréchal',
    'テール': 'Terre', 'ダム': 'Dame', 'ベル': 'Bel',
    'ラヴォー': 'Lavaux', 'スショ': 'Suchots', 'シュショ': 'Suchots',
    'エステート': 'Estate', 'ヴィンヤード': 'Vineyard',
    'ヴァレー': 'Valley', 'クルー': 'Cru',
    'シャン': 'Champ', 'コンブ': 'Combe',
    'レスプリ': "L'Esprit", 'ジャルダン': 'Jardin',
    'ボワ': 'Bois', 'クロワ': 'Croix', 'フィーユ': 'Feuille',
    'マール': 'Marc', 'リュー': 'Lieu', 'ディ': 'Dit',
    'ロンド': 'Ronde', 'バール': 'Bar',
    'モルジョ': 'Morgeot', 'ダネ': "d'Anet",
    'サンティエ': 'Sentier', 'ビュシエール': 'Bussière',
    'カイユレ': 'Caillerets', 'ミュルジェ': 'Murgers',
    'シャルモワ': 'Charmois', 'ルフェール': 'Referts',
    'ペリエール': 'Perrières', 'フュメ': 'Fumé',
    'リュジアン': 'Rugiens', 'オルヴォー': "d'Orveau",
    'バ': 'Bas', 'クラ': 'Cras', 'トリュフィエール': 'Truffières',
    'ドール': "d'Or", 'ゼロ': 'Zéro', 'フュエ': 'Fuées',
    'コルボー': 'Corbeaux', 'シャルム': 'Charmes',
    'シェルボード': 'Cherbaudes', 'フスロット': 'Fousselotte',
    'マレ': 'Marais', 'ドン': 'Don',
    'バローロ': 'Barolo', 'カネ': 'Canet',
    'アウフ': 'auf', 'エアデン': 'Erden', 'ヒンメル': 'Himmel',
    'モワンヌ': 'Moines', 'バ': 'Bas',
    'ザンセニエール': 'Censenier',
    'サンジャック': 'Saint-Jacques', 'コルヴェ': 'Corvées',
    'アルボワ': 'Arbois', 'ヴォルネー': 'Volnay',
    'モンテリー': 'Monthélie', 'サヴィーニ': 'Savigny',
    'オクセイ': 'Auxey', 'デュレス': 'Duresses',
    'シャロン': 'Chalon', 'ディケム': "d'Yquem",
    'ビアンブニュ': 'Bienvenues', 'バタール': 'Bâtard',
    'シュヴァリエール': 'Chevalières',
    'グランクリュ': 'Grand Cru',
}

# Compound entries (contain ・) — applied to full string before splitting
COMPOUND_VOCAB = {k: v for k, v in WINE_VOCAB.items() if '・' in k}
COMPOUND_SORTED = sorted(COMPOUND_VOCAB.items(), key=lambda x: len(x[0]), reverse=True)

# Non-compound entries with 3+ chars — applied to segments exactly
SEGMENT_VOCAB = {k: v for k, v in WINE_VOCAB.items() if '・' not in k}


def katakana_to_french(name):
    """Convert katakana wine name to French using vocabulary lookup"""
    if not name:
        return name

    # Step 1: EN_MAP exact match
    if name in EN_MAP:
        result = EN_MAP[name]
        if not any('\u3040' <= c <= '\u9fff' for c in result):
            return result

    # Step 2: Strip trailing annotations and retry
    suffixes_to_strip = [' ラック', ' ファインズ', ' ミレジム', ' VP', ' フィラディス',
                         ' 豊通', ' AMZ', ' ジェロボーム']
    clean_name = name
    for s in suffixes_to_strip:
        if name.endswith(s):
            clean_name = name[:-len(s)].strip()
            break

    if clean_name in EN_MAP:
        v = EN_MAP[clean_name]
        if not any('\u3040' <= c <= '\u9fff' for c in v):
            return v

    # Also try normalized forms
    for variant in [clean_name.replace('・', ' '), clean_name.replace('・', '-')]:
        if variant in EN_MAP:
            v = EN_MAP[variant]
            if not any('\u3040' <= c <= '\u9fff' for c in v):
                return v

    # Step 3: Replace compound vocab entries (those with ・) in the full string
    result = clean_name
    for ja, fr in COMPOUND_SORTED:
        if ja in result:
            result = result.replace(ja, fr)

    # Step 4: Split remaining ・-delimited segments and translate each
    parts = re.split(r'・', result)
    translated = []
    for part in parts:
        p = part.strip()
        if not p:
            continue
        # Check exact match in SEGMENT_VOCAB (non-compound, 3+ char entries)
        if p in SEGMENT_VOCAB:
            translated.append(SEGMENT_VOCAB[p])
        elif p in SINGLE_VOCAB:
            translated.append(SINGLE_VOCAB[p])
        else:
            translated.append(p)

    result = ' '.join(translated)
    result = re.sub(r'\s+', ' ', result).strip()
    return result


def katakana_to_french_producer(name):
    """Convert producer name - simpler, mostly proper nouns"""
    if not name:
        return name

    # Producers are proper nouns, harder to transliterate
    # Just return as-is for now - the katakana is preserved in name_kana
    # Some common producers we can map
    PRODUCER_MAP = {
        'ドメーヌ・ド・ラ・ロマネ・コンティ': 'Domaine de la Romanée-Conti',
        'ルロワ': 'Leroy',
        'ドメーヌ・ルロワ': 'Domaine Leroy',
        'フーリエ': 'Fourrier',
        'フーリエ(ドメーヌ)': 'Domaine Fourrier',
        'フーリエ(コント・ド・シャペル)': 'Fourrier (Comte de Chapelle)',
        'ジャック・セロス': 'Jacques Selosse',
        'クリュッグ': 'Krug',
        'ボランジェ': 'Bollinger',
        'ルイ・ロデレール': 'Louis Roederer',
        'ドン・ペリニヨン': 'Dom Pérignon',
        'アンリオ': 'Henriot',
        'テタンジェ': 'Taittinger',
        'ビルカール・サルモン': 'Billecart-Salmon',
        'ローラン・ポンソ': 'Laurent Ponsot',
        'ペロ・ミノ': 'Perrot-Minot',
        'ロベール・グロフィエ': 'Robert Groffier',
        'アルマン・ハイツ': 'Armand Heitz',
        'クロード・デュガ': 'Claude Dugat',
        'デュガ・ピィ': 'Dugat-Py',
        'アルロー(シプリアン)': 'Arlaud (Cyprien)',
        'デュジャック': 'Dujac',
        'ジョルジュ・ルーミエ': 'Georges Roumier',
        'ロベール・シュヴィヨン': 'Robert Chevillon',
        'アンリ・ボワイヨ(メゾン)': 'Henri Boillot (Maison)',
        'シャルル・ヴァン・カネイ': 'Charles Van Canneyt',
        'ニコル・ラマルシュ': 'Nicole Lamarche',
        'モンジャール・ミュニュレ': 'Mongeard-Mugneret',
        'ミシェル・マニャン': 'Michel Magnien',
        'アルノー・モルテ': 'Arnaud Mortet',
        'トラペ': 'Trapet',
        'セシル・トランブレイ': 'Cécile Tremblay',
        'ピエール・ダモワ': 'Pierre Damoy',
        'ジェラール・シュレール': 'Gérard Schueller',
        'マルキ・ダンジェルヴィル': "Marquis d'Angerville",
        'コント・ジョルジュ・ド・ヴォギュエ': 'Comte Georges de Vogüé',
        'ヴォギュエ': 'de Vogüé',
        'バシュレ・モノ': 'Bachelet-Monnot',
        'アグラパール・エ・フィス': 'Agrapart et Fils',
        'ジャクソン': 'Jacquesson',
        'ルナール・バルニエ': 'Renard Barnier',
        'ピエール・パイヤール': 'Pierre Paillard',
        'クリストフ・ミニョン': 'Christophe Mignon',
        'マルゲ': 'Marguet',
        'ベレッシュ': 'Bérêche',
        'ブルーノ・パイヤール': 'Bruno Paillard',
        'ドゥーツ': 'Deutz',
        'ノワック': 'Nowack',
        'ロワイエ・エ・フィス': 'Royer et Fils',
        'スナン': 'Suenen',
        'エグリ・ウーリエ': 'Egly-Ouriet',
        'サロン': 'Salon',
        'ルモワスネ': 'Remoissenet',
        'コシュ・デュリ': 'Coche-Dury',
        'ラフォン': 'Lafon',
        'ルフレーヴ': 'Leflaive',
        'ソゼ': 'Sauzet',
        'ラモネ': 'Ramonet',
        'ドメーヌ・ラモネ': 'Domaine Ramonet',
        'ポンソ': 'Ponsot',
        'ペリカン': 'Pélican',
        # Top Burgundy producers
        'フィリップ・パカレ': 'Philippe Pacalet',
        'アルマン・ルソー': 'Armand Rousseau',
        'エマニュエル・ルジェ': 'Emmanuel Rouget',
        'ジャック・フレデリック・ミュニエ': 'Jacques-Frédéric Mugnier',
        'ジャン・フィリップ・フィシェ': 'Jean-Philippe Fichet',
        'ジョルジュ・ミュニュレ・ジブール': 'Georges Mugneret-Gibourg',
        'アルロー': 'Arlaud',
        'セラファン': 'Sérafin',
        'シルヴァン・カティアール': 'Sylvain Cathiard',
        'エティエンヌ・ソゼ': 'Étienne Sauzet',
        'アルヌー・ラショー': 'Arnoux-Lachaux',
        'クリスチャン・チダ': 'Christian Tschida',
        'フーリエ(ジャン・マリー)': 'Fourrier (Jean-Marie)',
        'プリューレ・ロック': 'Prieuré-Roch',
        'ブノワ・アント': 'Benoît Ente',
        'ラルロ': "Domaine de l'Arlot",
        'ポール・ペルノ': 'Paul Pernot',
        'アンリ・ノーダン・フェラン': 'Henri Naudin-Ferrand',
        'メオ・カミュゼ(ドメーヌ)': 'Méo-Camuzet (Domaine)',
        'アラン・ユドロ・ノエラ': 'Alain Hudelot-Noëllat',
        'フォンテーヌ・ガニャール': 'Fontaine-Gagnard',
        'アントワーヌ・ルプティ': 'Antoine Lépetit',
        'ガヌヴァ': 'Ganevat',
        'アリス・エ・オリヴィエ・ド・ムール': 'Alice et Olivier de Moor',
        'ル・クロ・ド・ラ・ブリュイエール': 'Le Clos de la Bruyère',
        'クリスタルム': 'Crystallum',
        'オリヴィエ・バーンスタイン': 'Olivier Bernstein',
        'ヴァンサン・ドーヴィサ': 'Vincent Dauvissat',
        'セドリック・ブシャール': 'Cédric Bouchard',
        'シャルトーニュ・タイエ': 'Chartogne-Taillet',
        'ピエール・ペテルス': 'Pierre Péters',
        'シャトー・ディケム': "Château d'Yquem",
        'メゾン・テルセ': 'Maison Tercé',
        'ニコラス・ジェイ': 'Nicolas Jay',
        'ドニ・モルテ': 'Denis Mortet',
        'フィリポナ': 'Philipponnat',
        'マルク・ロワ': 'Marc Roy',
        'マルク・ソワイヤール(ド・ラ・クラ)': 'Marc Soyard (de la Cras)',
        'ガヌヴァ(アンヌ・エ・ジャン・フランソワ)': 'Ganevat (Anne et Jean-François)',
        'ケリー・フォックス': 'Kelley Fox',
        'フランソワ・ミエ': 'François Miée',
        'アルノー・アント': 'Arnaud Ente',
        'DRC': 'DRC',
        'バス・フィリップ': 'Bass Phillip',
        'E.ギガル': 'E. Guigal',
        'メゾン・レノ': 'Maison Leroy',
        'アントワーヌ・リエナルト': 'Antoine Lienhardt',
        'アンリ・ボノー': 'Henri Bonneau',
        'シャトー・マルゴー': 'Château Margaux',
        'キスラー': 'Kistler',
        'アンリ・グージュ(ドメーヌ)': 'Henri Gouges (Domaine)',
        'ディディエ・ダグノー': 'Didier Dagueneau',
        'エマニュエル・ルジェ(GFA ジュヌヴレイ)': 'Emmanuel Rouget (GFA Jeunevrey)',
        'シュヴィニー・ルソー': 'Chevigny-Rousseau',
        'ジャン・マリー・ブズロー': 'Jean-Marie Bouzereau',
        'ポル・ロジェ': 'Pol Roger',
        'トマ・モレ': 'Thomas Morey',
        'ジョセフ・ロティ': 'Joseph Roty',
        'メオ・カミュゼ・フレール・エ・スール': 'Méo-Camuzet Frère et Sœur',
        'ピーター・マイケル': 'Peter Michael',
        'デ・クロワ': 'de Croix',
        'エドゥアール・ドロネー': 'Édouard Delaunay',
        'パスカル・コタ': 'Pascal Cotat',
        'フレデリック・サヴァール': 'Frédéric Savart',
        'ダヴィッド・レクラパール': 'David Léclapart',
        'ロジェ・プイヨン': 'Roger Pouillon',
        'モエ・エ・シャンドン': 'Moët et Chandon',
        'ピエール・ギユモ': 'Pierre Gimonnet',
        'プティ・ロワ': 'Petit Roy',
        'フランソワ・コタ': 'François Cotat',
        'ブノワ・モロー': 'Benoît Moreau',
        'ローネイ・オリオ': 'Launay-Horiot',
        'シルヴァン・パタイユ': 'Sylvain Pataille',
        'サディ・ファミリー・ワインズ': 'Sadie Family Wines',
        'ミシェル・マニャン': 'Michel Magnien',
        'アルロー(シプリアン)': 'Arlaud (Cyprien)',
        'シャルル・ヴァン・カネイ': 'Charles Van Canneyt',
        'ニコル・ラマルシュ': 'Nicole Lamarche',
        'モンジャール・ミュニュレ': 'Mongeard-Mugneret',
    }
    return PRODUCER_MAP.get(name, name)


# --- Fetch current Burgundy items from API ---
API = 'https://wine-compass.vercel.app'

print('Fetching ALL items from API...')
all_items = []
page = 1
while True:
    resp = requests.get(f'{API}/api/beverages?limit=200&page={page}', timeout=60)
    data = resp.json()
    items = data.get('items', [])
    if not items:
        break
    all_items.extend(items)
    if len(all_items) >= data.get('total', 0):
        break
    page += 1
    if page % 10 == 0:
        try:
            print(f'  ... {len(all_items)} items fetched (page {page})')
        except:
            pass

print(f'Fetched {len(all_items)} items')

# --- Generate French names ---
updates = []
for item in all_items:
    # Use name_kana (original katakana) as source if available, else name
    name_ja = item.get('name_kana') or item['name']
    current_name = item['name']
    producer_ja = item.get('producer', '')

    name_fr = katakana_to_french(name_ja)
    producer_fr = katakana_to_french_producer(producer_ja) if producer_ja else None

    # Only update if converted name differs from CURRENT name in DB
    if name_fr != current_name or (producer_fr and producer_fr != producer_ja):
        updates.append({
            'id': item['id'],
            'name_fr': name_fr,
            'name_ja': name_ja,
            'producer_fr': producer_fr,
            'producer_ja': producer_ja,
        })

print(f'\nConversions: {len(updates)} items to update')

# Show samples
with open(r'C:\Users\RyojiHayashi\Downloads\french_names_preview.txt', 'w', encoding='utf-8') as f:
    f.write(f'Total items: {len(all_items)}\n')
    f.write(f'Items to update: {len(updates)}\n\n')

    f.write('=== ALL CONVERSIONS ===\n')
    for u in updates:
        f.write(f'  {u["name_ja"]}\n')
        f.write(f'  → {u["name_fr"]}\n')
        if u['producer_fr'] and u['producer_fr'] != u['producer_ja']:
            f.write(f'  [{u["producer_ja"]} → {u["producer_fr"]}]\n')
        f.write('\n')

print('Preview written to french_names_preview.txt')

# --- Push updates to DB ---
UPDATE_API = f'{API}/api/beverages/bulk-update'

# Build update payloads: name→French, name_kana→original katakana
db_updates = []
for u in updates:
    fields = {'id': u['id'], 'name': u['name_fr'], 'name_kana': u['name_ja']}
    if u.get('producer_fr') and u['producer_fr'] != u.get('producer_ja'):
        fields['producer'] = u['producer_fr']
    db_updates.append(fields)

print(f'\nPushing {len(db_updates)} updates to DB...')
chunk_size = 100
total_ok = 0
total_fail = 0

for i in range(0, len(db_updates), chunk_size):
    chunk = db_updates[i:i+chunk_size]
    try:
        resp = requests.post(UPDATE_API, json={'updates': chunk}, timeout=120)
        result = resp.json()
        ok = result.get('updated', 0)
        fail = result.get('failed', 0)
        total_ok += ok
        total_fail += fail
        try:
            print(f'  Chunk {i//chunk_size+1}: {ok} ok, {fail} fail')
        except:
            pass
    except Exception as e:
        print(f'  Chunk {i//chunk_size+1}: ERROR')
        total_fail += len(chunk)

print(f'\nDone! Updated: {total_ok}, Failed: {total_fail}')
