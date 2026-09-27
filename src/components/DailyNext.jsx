export default function DailyNext() {
  const progress = window.TrPuzzleProgress?.(new Date()) || {};
  const games = [['Harfle','harfle'],['Harf500','harf500'],['Baklava','baklava'],['Arala','arala'],['Tilkile','tilkile'],['Kesme','kesme'],['Bağla','bagla']];
  const next = games.find(([name]) => progress[name] !== 'completed');
  return <section className="tp-next">
    <span>{next ? 'Bugün bir bulmaca daha?' : 'Harika, bugünkü sekiz oyunu tamamladın!'}</span>
    <a href="/">Bugünkü oyunlara dön</a>
    {next && <a href={'/'+next[1]+'/'}>{next[0]} · {progress[next[0]] === 'started' ? 'Devam Et' : 'Oyna'}</a>}
  </section>;
}
