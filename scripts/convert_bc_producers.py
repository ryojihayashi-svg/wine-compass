#!/usr/bin/env python3
"""Convert katakana producer names to Latin in BeverageCompass HTML.

Usage:
  python scripts/convert_bc_producers.py                  # dry run
  python scripts/convert_bc_producers.py --apply          # modify in place
"""
import sys, io, re, json, argparse, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load WC producer map
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(SCRIPT_DIR, 'producer_vocab.py'), encoding='utf-8').read())

# BC-specific supplementary mappings (not in WC PRODUCER_MAP)
BC_EXTRA = {
    "E.ギガル": "E. Guigal",
    "JFミュニエ": "J.F. Mugnier",
    "JJコンフュロン": "J.J. Confuron",
    "アグラパール・エ・フィス": "Agrapart & Fils",
    "アルヌー・ラショー": "Arnoux-Lachaux",
    "アルノー・アント": "Arnaud Ente",
    "アルノー・モルテ": "Arnaud Mortet",
    "アルバロ・パラシオス": "Álvaro Palacios",
    "アルマン・ハイツ": "Armand Heitz",
    "アルマン・ルソー": "Armand Rousseau",
    "アルロー": "Arlaud",
    "アルロー(シプリアン)": "Arlaud (Cyprien)",
    "アントワーヌ・リエナルト": "Antoine Lienhardt",
    "アントワーヌ・ルプティ": "Antoine Lépetit",
    "アンリオ": "Henriot",
    "アンリ・グージュ(ドメーヌ)": "Henri Gouges (Domaine)",
    "アンリ・ノーダン・フェラン": "Henri Naudin-Ferrand",
    "アンリ・ボノー": "Henri Bonneau",
    "アンリ・ボワイヨ(メゾン)": "Henri Boillot (Maison)",
    "エグリ・ウーリエ": "Egly-Ouriet",
    "エティエンヌ・ソゼ": "Etienne Sauzet",
    "エドゥアルドヴァレンティー二": "Eduardo Valentini",
    "エドゥアール・ドロネー": "Édouard Delaunay",
    "エマニュエル・ルジェ(GFA ジュヌヴレイ)": "Emmanuel Rouget (GFA Genevriey)",
    "オスピスドボーヌ（コシュデュリ": "Hospices de Beaune (Coche-Dury)",
    "ガヌヴァ": "Ganevat",
    "ガヌヴァ(アンヌ・エ・ジャン・フランソワ)": "Ganevat (Anne & Jean-François)",
    "キスラー": "Kistler",
    "クリスチャン・チダ": "Christian Tschida",
    "クリストフ・ミニョン": "Christophe Mignon",
    "グレイスワイン": "Grace Wine",
    "ケリー・フォックス": "Kelley Fox",
    "サディ・ファミリー・ワインズ": "Sadie Family Wines",
    "サロン": "Salon",
    "シャルトーニュ・タイエ": "Chartogne-Taillet",
    "シャルル・ヴァン・カネイ": "Charles Van Canneyt",
    "シュヴィニー・ルソー": "Chevigny-Rousseau",
    "シルヴァン・カティアール": "Sylvain Cathiard",
    "シルヴァン・パタイユ": "Sylvain Pataille",
    "シードルリー・ド・ヴェルズィ": "Cidrerie de Verzy",
    "ジェラール・シュレール": "Gérard Schueller",
    "ジャクソン": "Jacquesson",
    "ジャンマリーフーリエ": "Jean-Marie Fourrier",
    "ジャン・マリー・ブズロー": "Jean-Marie Bouzereau",
    "ジョセフ・ロティ": "Joseph Roty",
    "ジョセフ・ヴォワイヨ": "Joseph Voillot",
    "ジョルジュ・ミュニュレ・ジブール": "Georges Mugneret-Gibourg",
    "セシル・トランブレイ": "Cécile Tremblay",
    "セドリック・ブシャール": "Cédric Bouchard",
    "セラファン": "Sérafin",
    "ダニエル・リオン": "Daniel Rion",
    "ダヴィッド・レクラパール": "David Léclapart",
    "ディディエ・ダグノー": "Didier Dagueneau",
    "ディフェクト": "Defekt",
    "デュガ・ピィ": "Dugat-Py",
    "デ・クロワ": "de Croix",
    "トマモレ": "Thomas Morey",
    "ドゥーツ": "Deutz",
    "ドメーヌ": "Domaine",
    "ドメーヌオヤマダ": "Domaine Oyamada",
    "ドメーヌヒデ": "Domaine Hide",
    "ナラ": "Nara",
    "ニコラス・ジェイ": "Nicolas Jay",
    "ニコル・ラマルシュ": "Nicole Lamarche",
    "ノワック": "Nowack",
    "バシュレ・モノ": "Bachelet-Monnot",
    "バス・フィリップ": "Bass Phillip",
    "パスカル・コタ": "Pascal Cotat",
    "ビルカール・サルモン": "Billecart-Salmon",
    "ビーズコ": "Bisco",
    "ピエール・ギユモ": "Pierre Gimonnet",
    "ピエール・ダモワ": "Pierre Damoy",
    "ピエール・パイヤール": "Pierre Paillard",
    "ピエール・ペテルス": "Pierre Péters",
    "ピーター・マイケル": "Peter Michael",
    "フィリップコラン": "Philippe Colin",
    "フィリップパカレ": "Philippe Pacalet",
    "フィリポナ": "Philipponnat",
    "フランソワ・ミエ": "François Mikulski",
    "フレデリック・サヴァール": "Frédéric Savart",
    "フーリエ(コント・ド・シャペル)": "Fourrier (Comtes de Chapelle)",
    "フーリエ(ジャン・マリー)": "Fourrier (Jean-Marie)",
    "フーリエ(ドメーヌ)": "Fourrier (Domaine)",
    "ブノワ・アント": "Benoît Ente",
    "ブノワ・モロー": "Benoît Moreau",
    "ブルーノ・パイヤール": "Bruno Paillard",
    "プティ・ロワ": "Petit Roy",
    "プリューレ・ロック": "Prieuré-Roch",
    "ベレッシュ": "Bérêche",
    "ペリカン": "Pélican",
    "ボランジェ": "Bollinger",
    "ポル・ロジェ": "Pol Roger",
    "ポンソ": "Ponsot",
    "マルキ・ダンジェルヴィル": "Marquis d'Angerville",
    "マルク・ソワイヤール(ド・ラ・クラ)": "Marc Soyard (de la Cra)",
    "マルゲ": "Marguet",
    "マルジリー": "Margillière",
    "ミシェル・シャプティエ": "Michel Chapoutier",
    "ミシェル・マニャン": "Michel Magnien",
    "メオ・カミュゼ(ドメーヌ)": "Méo-Camuzet (Domaine)",
    "メオ・カミュゼ・フレール・エ・スール": "Méo-Camuzet Frère et Sœur",
    "メゾン": "Maison",
    "メゾン・テルセ": "Maison Tercé",
    "メゾン・レノ": "Maison Leroy",
    "モエ・エ・シャンドン": "Moët & Chandon",
    "モンガク谷ワイナリー": "Mongaku Valley Winery",
    "ラルロ": "de l'Arlot",
    "ルナール・バルニエ": "Renard-Barnier",
    "ルモワスネ": "Remoissenet",
    "ルロワ": "Leroy",
    "ル・クロ・ド・ラ・ブリュイエール": "Le Clos de la Bruyère",
    "ロジェ・プイヨン": "Roger Pouillon",
    "ロワイエ・エ・フィス": "Royer & Fils",
    "ローネイ・オリオ": "Launay-Horiot",
    "ローラン・ポンソ": "Laurent Ponsot",
    "ワイマラマ": "Waimarama",
    "ヴァンサン・ゴードリー": "Vincent Gaudry",
    "二コラルナール": "Nicolas Renard",
    "鳥居平今村": "Toriihira Imamura",
    "１０Rワイナリー": "10R Winery",
    # Japanese-only items (keep as-is by omitting)
    # "きんせんウーロン" - Japanese tea, not a producer
    # "ほうおうたんそう　ミーランシャン" - Japanese entry
}

def normalize(s):
    """Normalize half-width katakana and whitespace."""
    return s.replace('ｰ', 'ー').replace('ｯ', 'ッ').replace('ｰ', 'ー').strip()

def main():
    parser = argparse.ArgumentParser(description='Convert BC producer names to Latin')
    parser.add_argument('--apply', action='store_true', help='Apply changes (default: dry run)')
    parser.add_argument('--html', default=r'C:\Users\RyojiHayashi\AppData\Local\Temp\beverage-compass\BeverageCompass_v5.html')
    args = parser.parse_args()

    # Build combined map
    combined = {}
    combined.update(PRODUCER_MAP)
    combined.update(BC_EXTRA)
    # Remove SKIP entries
    combined = {k: v for k, v in combined.items() if v != 'SKIP'}

    # Read HTML
    with open(args.html, 'r', encoding='utf-8') as f:
        html = f.read()

    m = re.search(r'(const ALLDATA\s*=\s*)(\{.*?\})(;)', html, re.DOTALL)
    if not m:
        print('ERROR: ALLDATA not found in HTML')
        sys.exit(1)

    data = json.loads(m.group(2))

    # Convert
    converted = 0
    skipped = 0
    unchanged = 0
    still_katakana = set()

    for store, items in data['stores'].items():
        for item in items:
            if len(item) > 1 and item[1]:
                original = item[1]
                normalized = normalize(original)
                if normalized in combined:
                    latin = combined[normalized]
                    if latin != original:
                        item[1] = latin
                        converted += 1
                    else:
                        unchanged += 1
                else:
                    skipped += 1
                    # Check if it has katakana
                    if re.search(r'[\u30A0-\u30FF]', normalized):
                        still_katakana.add(normalized)

    print(f'=== BC Producer Conversion {"(DRY RUN)" if not args.apply else "(APPLIED)"} ===')
    print(f'Converted:       {converted}')
    print(f'Already Latin:   {unchanged}')
    print(f'Skipped:         {skipped}')
    print(f'Still katakana:  {len(still_katakana)} unique')
    if still_katakana:
        print('\nRemaining katakana producers:')
        for p in sorted(still_katakana):
            print(f'  {p}')

    if args.apply:
        new_json = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        new_html = html[:m.start(2)] + new_json + html[m.end(2):]
        with open(args.html, 'w', encoding='utf-8') as f:
            f.write(new_html)
        print(f'\nWrote updated HTML to {args.html}')
    else:
        print(f'\nDry run complete. Use --apply to modify the file.')

if __name__ == '__main__':
    main()
