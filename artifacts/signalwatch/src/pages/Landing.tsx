import { Activity, ArrowRight, Inbox, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-react';
import { Link } from 'wouter';

const PREVIEW_ALERTS = [
  { id: 'a-1', groupName: 'Comercial SP · oportunidades', message: 'Empresa pública abre cotação para suporte de rede e segurança. Envio de propostas até sexta-feira.', keyword: 'cotação' },
  { id: 'a-2', groupName: 'Negócios & Parcerias BR', message: 'Busco parceiro no interior de Minas para distribuição de linha profissional. Operação recorrente.', keyword: 'parceiro' },
  { id: 'a-3', groupName: 'Fornecedores B2B Brasil', message: 'Indicação de fornecedor para câmeras IP em três unidades. Alguém atende a região Sul?', keyword: 'câmeras IP' },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#116b68] text-[#e9fff8]">
        <span className="absolute h-4 w-4 rounded-full border-2 border-current" />
        <span className="absolute h-1.5 w-1.5 rounded-full bg-current" />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#edb94b]" />
      </div>
      <span className="sw-display text-xl font-bold tracking-[-.04em] text-[#12383a]">SignalWatch</span>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="sw-noise min-h-[100dvh] overflow-hidden bg-[#f1faf6] text-[#12383a]">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-bold text-[#527874] md:flex">
          <a href="#como-funciona" data-testid="link-landing-how">Como funciona</a>
          <a href="#para-times" data-testid="link-landing-teams">Para times</a>
          <Link href="/privacy" data-testid="link-landing-privacy">Privacidade</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="rounded-lg px-3.5 py-2 text-sm font-bold text-[#527874] hover:bg-[#dff1eb]" data-testid="link-landing-sign-in">Entrar</Link>
          <Link href="/sign-up" className="rounded-lg bg-[#116b68] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(17,107,104,.2)] hover:bg-[#0d5754]" data-testid="link-landing-sign-up">
            Criar conta <ArrowRight className="ml-1 inline" size={15} />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-24">
          {/* Hero text */}
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b9ddd1] bg-[#e5f6ef] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-[#287a70]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#edbd54]" /> SignalWatch para operações comerciais
            </div>
            <h1 className="sw-display max-w-xl text-5xl font-bold leading-[.98] tracking-[-.065em] text-[#12383a] lg:text-[5.75rem]">
              Encontre o sinal.<br />
              <span className="text-[#2b8b7b]">Ignore o ruído.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-[#5f7e79] lg:text-lg">
              O SignalWatch lê seus grupos comerciais do Telegram e entrega só as conversas que podem virar negócio. Menos rolagem. Mais contexto para agir.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#116b68] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(17,107,104,.2)] hover:bg-[#0d5754]" data-testid="link-hero-start">
                Começar agora <ArrowRight size={17} />
              </Link>
              <a href="#como-funciona" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#bfded5] bg-[#f9fffc] px-5 py-3.5 text-sm font-extrabold text-[#38736d] hover:bg-[#e5f4ef]" data-testid="link-hero-how">
                Ver como funciona <Activity size={16} />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs font-semibold text-[#76918d]">
              <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-[#3c9d85]" /> Sessão protegida</span>
              <span className="flex items-center gap-1.5"><Zap size={15} className="text-[#d69f2b]" /> Feito para o dia a dia</span>
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="relative">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#cbeee0] blur-3xl" />
            <div className="relative rounded-[28px] border border-[#baded2] bg-[#e0f4ec] p-3 shadow-[0_26px_70px_rgba(31,98,87,.15)] lg:rotate-[1.5deg]">
              <div className="overflow-hidden rounded-2xl border border-[#c1ddd4] bg-[#f7fffb]">
                {/* Mock header */}
                <div className="flex items-center justify-between border-b border-[#d6ebe3] bg-[#eef9f4] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#116b68] text-white">
                      <Activity size={14} />
                    </div>
                    <span className="sw-display text-lg font-bold text-[#183f40]">signal / hoje</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#71908b]">09:42:18 BRT</span>
                </div>
                {/* Mock body */}
                <div className="grid grid-cols-[1fr_1.35fr]">
                  {/* Left sidebar */}
                  <div className="border-r border-[#d6ebe3] bg-[#f0faf6] p-5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#7d9c95]">Panorama</div>
                    <div className="mt-5 text-4xl font-bold tracking-[-.06em] text-[#173e40]">24</div>
                    <div className="text-xs text-[#76918c]">sinais hoje</div>
                    <div className="mt-6 space-y-3">
                      {[['Não lidos', '08', 'bg-[#edbd54]'], ['Regras', '02', 'bg-[#6bbca1]'], ['Grupos', '02', 'bg-[#75b3c0]']].map(([label, count, color]) => (
                        <div key={label} className="flex items-center justify-between text-xs">
                          <span className="text-[#698782]">{label}</span>
                          <span className="flex items-center gap-2 font-bold text-[#365d5b]">
                            <i className={`h-1.5 w-1.5 rounded-full ${color}`} />{count}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-9 rounded-xl bg-[#d4f0e5] p-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#27756b]">
                        <span className="h-2 w-2 rounded-full bg-[#369984]" /> radar ativo
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#b6dfd0]">
                        <div className="h-full w-3/4 bg-[#369984]" />
                      </div>
                    </div>
                  </div>
                  {/* Right panel */}
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#7d9c95]">Sinais recentes</div>
                      <span className="text-[10px] font-bold text-[#378b7b]">ver inbox</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {PREVIEW_ALERTS.map((a, i) => (
                        <div key={a.id} className={`rounded-xl border p-3 ${i === 0 ? 'border-[#a4d3c1] bg-[#f1fbf6]' : 'border-[#e0eee9] bg-[#f9fffc]'}`}>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#398277]">
                            <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-[#e4b147]' : 'bg-[#b9d3cc]'}`} />
                            {a.groupName}
                            <span className="font-normal text-[#98ada8]">· {i + 1}h</span>
                          </div>
                          <div className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#436461]">{a.message}</div>
                          <div className="mt-2 flex gap-1">
                            <span className="rounded bg-[#e3f4ed] px-1.5 py-0.5 font-mono text-[8px] text-[#458278]">#{a.keyword}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="border-y border-[#d7ebe4] bg-[#e8f6f0] px-5 py-20 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-xl">
              <div className="text-[11px] font-bold uppercase tracking-[.17em] text-[#398a80]">Um jeito mais lúcido de acompanhar</div>
              <h2 className="sw-display mt-3 text-4xl font-bold leading-tight tracking-[-.045em] text-[#12383a] lg:text-5xl">
                O trabalho não é ler tudo.<br />É saber o que abrir.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                ['01', 'Defina o contexto', 'Transforme sua intenção comercial em regras com palavras, grupos e prioridade.'],
                ['02', 'Deixe o radar operar', 'O SignalWatch cruza mensagens novas e reduz conversas inteiras a sinais acionáveis.'],
                ['03', 'Aja com contexto', 'Veja origem, autor, termos encontrados e tempo. Decida rápido, sem perder a trilha.'],
              ].map(([n, t, b]) => (
                <div key={n} className="border-t-2 border-[#68b9a1] pt-4">
                  <div className="font-mono text-xs font-bold text-[#4b9b87]">{n}</div>
                  <h3 className="sw-display mt-8 text-2xl font-bold text-[#164c4c]">{t}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#63827c]">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For teams */}
        <section id="para-times" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[.7fr_1.3fr] lg:items-center lg:px-10 lg:py-28">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.17em] text-[#398a80]">Para quem vende e acompanha</div>
            <h2 className="sw-display mt-3 text-4xl font-bold leading-tight tracking-[-.045em] text-[#12383a] lg:text-5xl">Uma tela que respeita seu tempo.</h2>
            <p className="mt-5 text-base leading-8 text-[#66827e]">Feito para pequenas empresas brasileiras e equipes comerciais que vivem entre conversas, oportunidades e decisões que não podem esperar.</p>
            <Link href="/sign-up" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#20786f] hover:gap-3" data-testid="link-section-start">
              Ver seu primeiro sinal <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#12383a] p-6 text-[#e4f7f0] sm:row-span-2">
              <div className="flex items-center gap-2 text-[#80dfc0]">
                <Inbox size={17} />
                <span className="text-xs font-bold uppercase tracking-widest">Inbox operacional</span>
              </div>
              <div className="sw-display mt-20 text-3xl font-bold">Tudo que importa,<br />em um lugar.</div>
              <p className="mt-4 text-sm leading-6 text-[#a2c9bf]">Sem dashboards que parecem planilhas. O próximo passo fica visível.</p>
            </div>
            <div className="rounded-2xl border border-[#cfe5dd] bg-[#eff9f5] p-6">
              <div className="text-[#cd9826]"><SlidersHorizontal size={21} /></div>
              <h3 className="sw-display mt-8 text-xl font-bold text-[#1d4f4d]">Regras com intenção</h3>
              <p className="mt-2 text-sm leading-6 text-[#6c8883]">Prioridade, cooldown e exclusões para reduzir falsos positivos.</p>
            </div>
            <div className="rounded-2xl border border-[#cfe5dd] bg-[#eff9f5] p-6">
              <div className="text-[#438a96]"><ShieldCheck size={21} /></div>
              <h3 className="sw-display mt-8 text-xl font-bold text-[#1d4f4d]">Privacidade explícita</h3>
              <p className="mt-2 text-sm leading-6 text-[#6c8883]">Integrações com estados claros. Nada é presumido.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#d8f2e8] px-5 py-20 text-center lg:px-10">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#116b68] text-[#86e7c6]">
              <Zap size={22} />
            </div>
            <h2 className="sw-display mt-6 text-4xl font-bold tracking-[-.05em] text-[#12383a] lg:text-5xl">
              Seu próximo negócio pode estar<br />na próxima mensagem.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#62827c]">Comece com uma regra. Ajuste com o tempo. O radar aprende o seu ritmo.</p>
            <Link href="/sign-up" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#116b68] px-5 py-3.5 text-sm font-extrabold text-white hover:bg-[#0d5754]" data-testid="link-final-start">
              Criar meu radar <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="flex flex-col justify-between gap-4 px-5 py-7 text-xs text-[#75938d] sm:flex-row lg:px-10">
        <Logo />
        <div className="flex gap-5">
          <Link href="/terms" data-testid="link-footer-terms">Termos</Link>
          <Link href="/privacy" data-testid="link-footer-privacy">Privacidade</Link>
          <span>© 2025 SignalWatch</span>
        </div>
      </footer>
    </div>
  );
}
