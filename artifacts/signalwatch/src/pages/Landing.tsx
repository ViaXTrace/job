import { BookOpen, ChevronRight, FileText, Lock, Scale, ShieldCheck, Terminal, Zap } from 'lucide-react';
import { Link } from 'wouter';

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="#116b68" />
        <polyline points="4,18 10,18 13,9 16,27 19,13 22,18 32,18" stroke="#e9fff8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="13" cy="9" r="2.5" fill="#edb94b" />
      </svg>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold tracking-[-0.04em] text-[#12383a]">SignalWatch</span>
    </div>
  );
}

const PREVIEW_ALERTS = [
  { id: 'a-1', groupName: 'Comercial SP · oportunidades', message: 'Empresa pública abre cotação para suporte de rede e segurança. Envio de propostas até sexta-feira.', keyword: 'cotação' },
  { id: 'a-2', groupName: 'Negócios & Parcerias BR', message: 'Busco parceiro no interior de Minas para distribuição de linha profissional. Operação recorrente.', keyword: 'parceiro' },
  { id: 'a-3', groupName: 'Fornecedores B2B Brasil', message: 'Indicação de fornecedor para câmeras IP em três unidades. Alguém atende a região Sul?', keyword: 'câmeras IP' },
];

export default function Landing() {
  return (
    <div className="sw-noise min-h-[100dvh] overflow-hidden bg-[#f0faf5] text-[#12383a]">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#4e7872] md:flex">
          <a href="#metodologia" className="hover:text-[#116b68]">Metodologia</a>
          <a href="#conformidade" className="hover:text-[#116b68]">Conformidade</a>
          <Link href="/privacy" className="hover:text-[#116b68]">Documentação</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#4e7872] hover:bg-[#ddf4ec] hover:text-[#116b68]" data-testid="link-landing-sign-in">
            Entrar
          </Link>
          <Link href="/sign-up" className="rounded-lg border border-[#116b68]/20 bg-[#116b68] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0d5754]" data-testid="link-landing-sign-up">
            Criar conta
          </Link>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10 lg:pt-20">
          <div className="relative z-10">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#a8d8c8] bg-[#dff2ea] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-[#267a70]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#edb94b]" />
              Inteligência de mercado · B2B
            </div>

            <h1 className="max-w-lg text-[2.8rem] font-bold leading-[1.08] tracking-[-0.055em] text-[#0e3035] lg:text-[3.8rem]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Monitoramento preciso.<br />
              <span className="text-[#2b8b7b]">Privacidade por arquitetura.</span>
            </h1>

            <p className="mt-6 max-w-md text-[0.95rem] leading-[1.85] text-[#547874]">
              Uma plataforma para profissionais e empresas que monitoram grupos do Telegram e precisam de inteligência estruturada — com controle total sobre o que é acompanhado, armazenado e descartado.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-in" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#116b68] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(17,107,104,.22)] hover:bg-[#0d5754]" data-testid="link-hero-start">
                Acessar plataforma <ChevronRight size={16} />
              </Link>
              <Link href="/privacy" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#b8ddd3] bg-white px-6 py-3.5 text-sm font-semibold text-[#38736d] hover:bg-[#eaf6f1]" data-testid="link-hero-docs">
                Política de privacidade
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: Lock, label: 'AES-256-GCM', sub: 'Sessões criptografadas' },
                { icon: ShieldCheck, label: 'LGPD', sub: 'Conformidade de dados' },
                { icon: Zap, label: 'Tempo real', sub: 'Detecção contínua' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-2.5 rounded-xl border border-[#cce4db] bg-white/70 px-3.5 py-3">
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e2f5ee] text-[#2d8575]">
                    <Icon size={13} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1c5450]">{label}</div>
                    <div className="mt-0.5 text-[10px] leading-4 text-[#6a8c86]">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="relative">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#c5eadc] opacity-60 blur-3xl" />
            <div className="relative rounded-[24px] border border-[#b7ddd0] bg-[#ddf2e9] p-3 shadow-[0_28px_72px_rgba(17,107,104,.16)] lg:rotate-[1deg]">
              <div className="overflow-hidden rounded-[18px] border border-[#c0dbd2] bg-[#f6fefb]">
                <div className="flex items-center justify-between border-b border-[#d4ebe3] bg-[#edf8f3] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-lg bg-[#116b68] text-white">
                      <Terminal size={12} />
                    </div>
                    <span className="text-sm font-bold text-[#183f40]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>signal / hoje</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#71908b]">LIVE · 24 sinais</span>
                </div>
                <div className="grid grid-cols-[1fr_1.35fr]">
                  <div className="border-r border-[#d4ebe3] bg-[#eef9f5] p-4">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#7a9c96]">Panorama</div>
                    <div className="mt-4 text-3xl font-bold tracking-[-0.06em] text-[#173e40]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>24</div>
                    <div className="text-[10px] text-[#76918c]">sinais hoje</div>
                    <div className="mt-5 space-y-2.5">
                      {[['Não lidos', '08', 'bg-[#edbd54]'], ['Regras', '02', 'bg-[#6bbca1]'], ['Grupos', '02', 'bg-[#75b3c0]']].map(([label, count, color]) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-[10px] text-[#698782]">{label}</span>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#365d5b]">
                            <i className={`h-1.5 w-1.5 rounded-full ${color}`} />{count}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-7 rounded-lg bg-[#ceeee2] p-2.5">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-[#27756b]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#369984]" /> radar ativo
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#b4ded0]">
                        <div className="h-full w-3/4 bg-[#369984]" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#7d9c95]">Sinais recentes</div>
                    <div className="mt-3 space-y-2.5">
                      {PREVIEW_ALERTS.map((a, i) => (
                        <div key={a.id} className={`rounded-lg border p-2.5 ${i === 0 ? 'border-[#a4d3c1] bg-[#f1fbf6]' : 'border-[#deeee8] bg-[#f9fffc]'}`}>
                          <div className="flex items-center gap-1 text-[8px] font-bold text-[#398277]">
                            <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-[#e4b147]' : 'bg-[#b9d3cc]'}`} />
                            {a.groupName}
                          </div>
                          <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#436461]">{a.message}</div>
                          <div className="mt-1.5">
                            <span className="rounded bg-[#e3f4ed] px-1.5 py-0.5 font-mono text-[7px] text-[#458278]">#{a.keyword}</span>
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

        {/* ── Metodologia ─────────────────────────────────────────────── */}
        <section id="metodologia" className="border-y border-[#d4e8e0] bg-white px-5 py-20 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-xl">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[.17em] text-[#38877c]">Nossa abordagem</div>
              <h2 className="text-3xl font-bold leading-tight tracking-[-0.045em] text-[#0e3035] lg:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Construído para quem não tem<br />espaço para pressupostos.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#567774]">
                Cada decisão de produto parte da premissa de que o usuário sabe o que busca. Não há gamificação, painéis de engajamento ou push agressivo. Só sinal.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  n: '01',
                  icon: Terminal,
                  title: 'Detecção por intenção',
                  body: 'As regras são definidas com palavras-chave, operadores lógicos e exclusões explícitas. O sistema não infere — ele executa o que foi configurado.',
                },
                {
                  n: '02',
                  icon: ShieldCheck,
                  title: 'Isolamento de sessão',
                  body: 'Cada conta opera com sua própria sessão Telegram criptografada. Nenhum dado de grupo ou mensagem é compartilhado entre usuários.',
                },
                {
                  n: '03',
                  icon: Scale,
                  title: 'Auditabilidade',
                  body: 'Cada sinal registra origem, autor, horário e regra que o gerou. O histórico é auditável e deletável a qualquer momento.',
                },
              ].map(({ n, icon: Icon, title, body }) => (
                <div key={n} className="rounded-2xl border border-[#d0e8e0] bg-[#f8fffc] p-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e0f4eb] text-[#2d8070]">
                      <Icon size={16} />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#5a9a8e]">{n}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#163b3a]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                  <p className="mt-2.5 text-sm leading-[1.75] text-[#5f7e79]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Como funciona ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
          <div className="mb-12 max-w-lg">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[.17em] text-[#38877c]">Fluxo operacional</div>
            <h2 className="text-3xl font-bold leading-tight tracking-[-0.045em] text-[#0e3035] lg:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Do grupo ao sinal.<br />Com rastreabilidade completa.
            </h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-[22px] top-8 hidden h-[calc(100%-64px)] w-px bg-[#c8e4db] md:block" />
            <div className="space-y-6">
              {[
                {
                  n: '01',
                  title: 'Autorize sua sessão com QR code',
                  body: 'A sessão é estabelecida via autenticação QR do próprio Telegram. Nenhuma senha é solicitada. A sessão fica vinculada exclusivamente à sua conta na plataforma.',
                  badge: 'Sem senha · OAuth-like',
                },
                {
                  n: '02',
                  title: 'Configure regras com precisão cirúrgica',
                  body: 'Defina palavras-chave obrigatórias, de exclusão e grupos-alvo. Configure prioridade, cooldown e tipo de correspondência (parcial, exata ou regex).',
                  badge: 'Matching configurável',
                },
                {
                  n: '03',
                  title: 'Receba sinais estruturados no inbox',
                  body: 'Cada alerta inclui grupo, autor, horário BRT, fragmento da mensagem, palavras-chave encontradas e regra acionada. Favoritos, leitura e arquivo disponíveis.',
                  badge: 'Rastreável · Auditável',
                },
              ].map(({ n, title, body, badge }) => (
                <div key={n} className="relative flex gap-6 rounded-2xl border border-[#d0e6de] bg-white p-6 shadow-[0_2px_12px_rgba(17,107,104,.06)]">
                  <div className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#116b68] text-white text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {n}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-[#163b3a]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                      <span className="rounded-full bg-[#e8f7f1] px-2.5 py-1 text-[10px] font-bold text-[#2e7e72]">{badge}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#567774]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Conformidade ────────────────────────────────────────────── */}
        <section id="conformidade" className="bg-[#12383a] px-5 py-20 text-[#d4efe8] lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[.17em] text-[#80d9be]">Privacidade e conformidade</div>
                <h2 className="text-3xl font-bold leading-tight tracking-[-0.045em] text-white lg:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Seus dados, sua jurisdição,<br />seu controle.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#92c5b8]">
                  A arquitetura da plataforma foi projetada com isolamento como premissa — não como recurso adicional. Abaixo estão os compromissos estruturais do produto.
                </p>
              </div>
              <div className="flex items-start">
                <Link href="/privacy" className="inline-flex items-center gap-2 rounded-xl border border-[#3a6d6b] bg-[#1e4f4d] px-4 py-2.5 text-sm font-semibold text-[#80d9be] hover:bg-[#2a5e5c]">
                  <FileText size={15} />
                  Política de privacidade completa
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Lock, title: 'AES-256-GCM', body: 'Sessões Telegram criptografadas com chave derivada por conta. Nenhuma sessão de terceiros tem acesso cruzado.' },
                { icon: ShieldCheck, title: 'Conformidade LGPD', body: 'Dados tratados estritamente conforme o escopo autorizado. Solicitação de exclusão disponível nas configurações de conta.' },
                { icon: Scale, title: 'Dados por usuário', body: 'Histórico, grupos, regras e alertas ficam segregados por conta. Nada é compartilhado ou agregado entre usuários distintos.' },
                { icon: BookOpen, title: 'Auditoria de acesso', body: 'Cada sessão ativa é registrada com dispositivo, IP e horário. Revogue acesso de dispositivos suspeitos diretamente na plataforma.' },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-[#2e5e5c] bg-[#1a4748] p-5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#276160] text-[#80d9be]">
                    <Icon size={16} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#92c5b8]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Documentação / Termos ────────────────────────────────────── */}
        <section className="border-y border-[#d4e8e0] bg-[#f8fffc] px-5 py-16 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-[11px] font-bold uppercase tracking-[.17em] text-[#38877c]">Estrutura legal e técnica</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: FileText, label: 'Termos de uso', href: '/terms', desc: 'Condições de uso da plataforma, limitações de responsabilidade e escopo do serviço.' },
                { icon: ShieldCheck, label: 'Política de privacidade', href: '/privacy', desc: 'Como os dados são coletados, processados e protegidos conforme a LGPD.' },
                { icon: BookOpen, label: 'Central de ajuda', href: '/privacy', desc: 'Documentação operacional, FAQs e guias de configuração de regras e conexão.' },
              ].map(({ icon: Icon, label, href, desc }) => (
                <Link key={label} href={href} className="group flex gap-4 rounded-xl border border-[#cce4db] bg-white p-5 hover:border-[#116b68]/30 hover:shadow-[0_4px_16px_rgba(17,107,104,.08)]">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e4f4ee] text-[#2d8070] group-hover:bg-[#d0eee5]">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#163b3a]">{label}</div>
                    <p className="mt-1 text-xs leading-5 text-[#5f7e79]">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#d4e8e0] bg-[#f0faf5]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-8 sm:flex-row sm:items-center lg:px-10">
          <Logo />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#6a8c86]">
            <Link href="/terms" className="hover:text-[#116b68]" data-testid="link-footer-terms">Termos de uso</Link>
            <Link href="/privacy" className="hover:text-[#116b68]" data-testid="link-footer-privacy">Privacidade</Link>
            <span className="text-[#a8c4bc]">© 2026 SignalWatch</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
