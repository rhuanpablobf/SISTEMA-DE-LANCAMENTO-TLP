'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Simulacao {
    id_simulacao: string;
    exercicio: number;
    status: string;
    descricao: string;
    created_at: string;
    parametros_snapshot: any;
}

export default function SimulacoesPage() {
    const [list, setList] = useState<Simulacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [exercicio, setExercicio] = useState(new Date().getFullYear() + 1);
    const [descricao, setDescricao] = useState('');

    // Parâmetros de Entrada (usuário informa)
    const [custoBase, setCustoBase] = useState<number>(0);
    const [ipca, setIpca] = useState<number>(0);
    const [subsidioPerc, setSubsidioPerc] = useState<number>(65);

    // VALORES BASE DA LEI (2025) - Usados como fallback
    const LIMITE_MIN_LEI_2025 = 258.00;
    const LIMITE_MAX_LEI_2025 = 1600.08;

    // Limites Base Dinâmicos (vem do lote anterior ou da lei)
    const [limiteMinBase, setLimiteMinBase] = useState<number>(LIMITE_MIN_LEI_2025);
    const [limiteMaxBase, setLimiteMaxBase] = useState<number>(LIMITE_MAX_LEI_2025);
    const [fonteBase, setFonteBase] = useState<string>('Lei 2025');

    // Valores Calculados
    const [custoAtualizado, setCustoAtualizado] = useState<number>(0);
    const [valorSubsidio, setValorSubsidio] = useState<number>(0);
    const [custoFinal, setCustoFinal] = useState<number>(0);
    const [limiteMinAtualizado, setLimiteMinAtualizado] = useState<number>(LIMITE_MIN_LEI_2025);
    const [limiteMaxAtualizado, setLimiteMaxAtualizado] = useState<number>(LIMITE_MAX_LEI_2025);

    // EFEITO: Busca limites do lote do ano anterior quando exercício muda
    useEffect(() => {
        const buscarLimiteBase = async () => {
            const anoAnterior = exercicio - 1;

            if (anoAnterior < 2025) {
                // Para 2025 ou antes, usa valores da lei
                setLimiteMinBase(LIMITE_MIN_LEI_2025);
                setLimiteMaxBase(LIMITE_MAX_LEI_2025);
                setFonteBase('Lei 2025 (Base Original)');
                return;
            }

            try {
                const response = await api.get(`/lotes/ultimo/${anoAnterior}`);
                if (response.data && response.data.encontrado && response.data.limite_min_atualizado > 0) {
                    // Usa os limites atualizados do lote do ano anterior como nova base
                    setLimiteMinBase(response.data.limite_min_atualizado);
                    setLimiteMaxBase(response.data.limite_max_atualizado);
                    setFonteBase(`Lote Oficial ${anoAnterior} (v${response.data.versao})`);
                } else {
                    // Nenhum lote encontrado, usa valores da lei
                    setLimiteMinBase(LIMITE_MIN_LEI_2025);
                    setLimiteMaxBase(LIMITE_MAX_LEI_2025);
                    setFonteBase('Lei 2025 (Sem lote anterior)');
                }
            } catch (err) {
                console.error('Erro ao buscar lote anterior:', err);
                setLimiteMinBase(LIMITE_MIN_LEI_2025);
                setLimiteMaxBase(LIMITE_MAX_LEI_2025);
                setFonteBase('Lei 2025 (Erro ao buscar)');
            }
        };

        buscarLimiteBase();
    }, [exercicio]);

    // EFEITO: Recalcula todos os valores derivados
    useEffect(() => {
        const fatorIpca = 1 + (ipca / 100);

        // Custo atualizado pelo IPCA
        const custoAtual = custoBase * fatorIpca;
        setCustoAtualizado(Number(custoAtual.toFixed(2)));

        // Valor do subsídio
        const subsidio = custoAtual * (subsidioPerc / 100);
        setValorSubsidio(Number(subsidio.toFixed(2)));

        // Custo final após subsídio
        setCustoFinal(Number((custoAtual - subsidio).toFixed(2)));

        // Limites atualizados pelo IPCA (usando base dinâmica)
        setLimiteMinAtualizado(Number((limiteMinBase * fatorIpca).toFixed(2)));
        setLimiteMaxAtualizado(Number((limiteMaxBase * fatorIpca).toFixed(2)));
    }, [custoBase, ipca, subsidioPerc, limiteMinBase, limiteMaxBase]);

    const loadList = async () => {
        try {
            const response = await api.get('/simulacoes');
            setList(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadList();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (custoBase <= 0) {
            alert('Informe o Custo TLP Base');
            return;
        }
        try {
            await api.post('/simulacoes', {
                exercicio: Number(exercicio),
                descricao,
                custo_tlp_base: custoBase,
                ipca_percentual: ipca,
                subsidio_percentual: subsidioPerc,
                limite_min_base: limiteMinBase,
                limite_max_base: limiteMaxBase,
                limite_min_atualizado: limiteMinAtualizado,
                limite_max_atualizado: limiteMaxAtualizado,
                // Campos calculados extras
                custo_atualizado: custoAtualizado,
                valor_subsidio: valorSubsidio,
                custo_final: custoFinal
            });
            setShowForm(false);
            setDescricao('');
            setCustoBase(0);
            setIpca(0);
            setSubsidioPerc(65);
            loadList();
        } catch (err: any) {
            alert('Erro ao criar simulação: ' + (err?.response?.data?.detail || err.message));
        }
    };

    const handleGerarLote = async (idSimulacao: string) => {
        if (!confirm('Deseja gerar um Lote de Lançamento Oficial a partir desta simulação?')) return;
        try {
            await api.post('/lotes', { id_simulacao_origem: idSimulacao });
            alert('Lote gerado com sucesso!');
            loadList();
        } catch (err: any) {
            alert('Erro ao gerar lote: ' + (err?.response?.data?.detail || err.message));
        }
    };

    // Estado para resultado da simulação processada
    const [resultadoSimulacao, setResultadoSimulacao] = useState<any>(null);
    const [showResultado, setShowResultado] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progresso, setProgresso] = useState<{ percentual: number; itens: number; total: number; tempo: number } | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleProcessarSimulacao = async (idSimulacao: string) => {
        if (!confirm('Deseja processar esta simulação e calcular a TLP para todos os imóveis? Isso pode levar alguns minutos.')) return;

        setProcessing(true);
        setProcessingId(idSimulacao);
        setProgresso({ percentual: 0, itens: 0, total: 0, tempo: 0 });
        const startTime = Date.now();

        try {
            // Iniciar processamento em background (não espera terminar)
            const processPromise = api.post(`/simulacoes/${idSimulacao}/processar`);

            // Polling do progresso a cada 2 segundos
            const pollProgress = async () => {
                while (true) {
                    try {
                        const progressRes = await api.get(`/simulacoes/${idSimulacao}/progresso`);
                        const data = progressRes.data;
                        const elapsed = Math.round((Date.now() - startTime) / 1000);

                        setProgresso({
                            percentual: data.progresso_percentual || 0,
                            itens: data.itens_processados || 0,
                            total: data.total_imoveis || 0,
                            tempo: elapsed
                        });

                        if (data.concluido || data.status === 'CONCLUIDO') {
                            break;
                        }
                        if (data.status === 'ERRO') {
                            throw new Error('Processamento falhou');
                        }
                    } catch (pollErr) {
                        // Ignorar erros de polling, continuar tentando
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            };

            // Rodar polling em paralelo
            await Promise.race([
                processPromise.then(() => pollProgress()),
                pollProgress()
            ]);

            // Buscar resultado final
            const res = await api.get(`/simulacoes/${idSimulacao}/resultado`);
            setResultadoSimulacao(res.data);
            setShowResultado(true);
            loadList();

        } catch (err: any) {
            alert('Erro ao processar simulação: ' + (err?.response?.data?.detail || err.message));
        } finally {
            setProcessing(false);
            setProcessingId(null);
            setProgresso(null);
        }
    };

    const handleVerResultado = async (idSimulacao: string) => {
        try {
            const res = await api.get(`/simulacoes/${idSimulacao}/resultado`);
            setResultadoSimulacao(res.data);
            setShowResultado(true);
        } catch (err: any) {
            alert('Erro ao buscar resultado: ' + (err?.response?.data?.detail || err.message));
        }
    };

    const handleResetarSimulacao = async (idSimulacao: string) => {
        if (!confirm('Deseja resetar esta simulação para RASCUNHO? Isso permitirá processá-la novamente.')) return;
        try {
            await api.post(`/simulacoes/${idSimulacao}/resetar`);
            alert('Simulação resetada com sucesso!');
            loadList();
        } catch (err: any) {
            alert('Erro ao resetar: ' + (err?.response?.data?.detail || err.message));
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'RASCUNHO': return 'bg-gray-200 text-gray-700';
            case 'EM_PROCESSAMENTO': return 'bg-blue-100 text-blue-700';
            case 'CONCLUIDO': return 'bg-green-100 text-green-700';
            case 'CONVERTIDO_LOTE': return 'bg-purple-100 text-purple-700';
            case 'ERRO': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100';
        }
    };

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="container-premium">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Simulações</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Crie cenários de teste antes do lançamento oficial.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : 'Nova Simulação'}
                </Button>
            </header>

            {showForm && (
                <div style={{ marginBottom: '2rem' }} className="fade-in">
                    <Card>
                        <CardHeader><CardTitle>Nova Simulação - Exercício {exercicio}</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                                {/* Linha 1: Exercício e Descrição */}
                                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem' }}>
                                    <Input
                                        label="Exercício"
                                        type="number"
                                        value={exercicio}
                                        onChange={e => setExercicio(Number(e.target.value))}
                                    />
                                    <Input
                                        label="Descrição do Cenário"
                                        placeholder="Ex: Simulação com IPCA de 4,46%"
                                        value={descricao}
                                        onChange={e => setDescricao(e.target.value)}
                                    />
                                </div>

                                {/* Seção: Parâmetros de Entrada */}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Parâmetros de Entrada</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                        <Input
                                            label="Custo TLP Base (R$)"
                                            type="number"
                                            step="0.01"
                                            value={custoBase || ''}
                                            onChange={e => setCustoBase(Number(e.target.value))}
                                            placeholder="Informe o custo"
                                        />
                                        <Input
                                            label="IPCA (%)"
                                            type="number"
                                            step="0.01"
                                            value={ipca}
                                            onChange={e => setIpca(Number(e.target.value))}
                                        />
                                        <Input
                                            label="Subsídio (%)"
                                            type="number"
                                            step="0.01"
                                            value={subsidioPerc}
                                            onChange={e => setSubsidioPerc(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* Seção: Valores Calculados */}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary-600)' }}>Valores Calculados (Custo × IPCA - Subsídio)</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Custo Atualizado</p>
                                            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(custoAtualizado)}</p>
                                        </div>
                                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Valor Subsídio ({subsidioPerc}%)</p>
                                            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--danger)' }}>- {formatCurrency(valorSubsidio)}</p>
                                        </div>
                                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-bg, #ecfdf5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success, #10b981)' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Custo Final (Após Subsídio)</p>
                                            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success, #059669)' }}>{formatCurrency(custoFinal)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Seção: Limites */}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Limites de Valor por Imóvel</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                        {/* Valores Base - Dinâmicos (do lote anterior ou da lei) */}
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                                Valores Base <span style={{ fontStyle: 'italic', fontWeight: 400 }}>({fonteBase})</span>
                                            </p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-sm)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Mínimo Base</p>
                                                    <p style={{ fontWeight: 600 }}>{formatCurrency(limiteMinBase)}</p>
                                                </div>
                                                <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-sm)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Máximo Base</p>
                                                    <p style={{ fontWeight: 600 }}>{formatCurrency(limiteMaxBase)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Valores Atualizados - CALCULADOS */}
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)', marginBottom: '0.5rem' }}>Valores Atualizados ({exercicio}) = Base × (1 + {ipca}%)</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-200)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mínimo Atualizado</p>
                                                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-700)' }}>{formatCurrency(limiteMinAtualizado)}</p>
                                                </div>
                                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-200)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Máximo Atualizado</p>
                                                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-700)' }}>{formatCurrency(limiteMaxAtualizado)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                                    <Button type="submit">Criar Simulação</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loading ? <p>Carregando...</p> : list.length === 0 ? (
                    <Card>
                        <CardContent><p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Nenhuma simulação cadastrada.</p></CardContent>
                    </Card>
                ) : list.map((item) => (
                    <Card key={item.id_simulacao}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{item.descricao || `Simulação ${item.exercicio}`}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Exercício {item.exercicio} • Criado em {new Date(item.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {/* Botão Simular Lançamento - apenas para RASCUNHO */}
                                {item.status === 'RASCUNHO' && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleProcessarSimulacao(item.id_simulacao)}
                                        disabled={processing}
                                    >
                                        {processing ? 'Processando...' : '🚀 Simular Lançamento'}
                                    </Button>
                                )}

                                {/* Ver Resultado - apenas para CONCLUIDO */}
                                {item.status === 'CONCLUIDO' && (
                                    <Button variant="primary" size="sm" onClick={() => handleVerResultado(item.id_simulacao)}>
                                        📊 Ver Resultado
                                    </Button>
                                )}

                                {/* Gerar Lote - para CONCLUIDO */}
                                {item.status === 'CONCLUIDO' && (
                                    <Button variant="outline" size="sm" onClick={() => handleGerarLote(item.id_simulacao)}>
                                        Gerar Lote Oficial
                                    </Button>
                                )}

                                {/* Botão Resetar - para EM_PROCESSAMENTO ou ERRO */}
                                {(item.status === 'EM_PROCESSAMENTO' || item.status === 'ERRO') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleResetarSimulacao(item.id_simulacao)}
                                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                    >
                                        🔄 Resetar
                                    </Button>
                                )}

                                <Button variant="outline" size="sm">Ver Detalhes</Button>
                            </div>
                        </div>
                        {/* Snapshot info */}
                        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <span>Custo Base: <strong>{formatCurrency(Number(item.parametros_snapshot?.custo_tlp_base || 0))}</strong></span>
                            <span>IPCA: <strong>{item.parametros_snapshot?.ipca_percentual || 0}%</strong></span>
                            <span>Subsídio: <strong>{item.parametros_snapshot?.subsidio_percentual || 0}%</strong></span>
                            <span>Limite Min: <strong>{formatCurrency(Number(item.parametros_snapshot?.limite_min_atualizado || 0))}</strong></span>
                            <span>Limite Max: <strong>{formatCurrency(Number(item.parametros_snapshot?.limite_max_atualizado || 0))}</strong></span>
                        </div>

                        {/* Barra de Progresso - exibido apenas durante processamento */}
                        {processingId === item.id_simulacao && progresso && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--bg-body) 100%)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                        ⏳ Processando Simulação...
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {progresso.tempo}s decorridos
                                    </span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: 'var(--bg-body)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${progresso.percentual}%`,
                                        height: '100%',
                                        backgroundColor: 'var(--primary)',
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <span>{progresso.itens.toLocaleString()} / {progresso.total.toLocaleString()} imóveis</span>
                                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{progresso.percentual}%</span>
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* MODAL DE RESULTADO */}
            {showResultado && resultadoSimulacao && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: 'var(--radius-lg)',
                        padding: '2rem', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📊 Resultado da Simulação</h2>
                            <Button variant="outline" size="sm" onClick={() => setShowResultado(false)}>✕ Fechar</Button>
                        </div>

                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            {resultadoSimulacao.simulacao?.descricao} - Exercício {resultadoSimulacao.simulacao?.exercicio}
                        </p>

                        {/* Estatísticas Principais */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--primary-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Imóveis</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                                    {resultadoSimulacao.estatisticas?.total_imoveis?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--success-bg, #ecfdf5)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Arrecadado</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success, #059669)' }}>
                                    {formatCurrency(resultadoSimulacao.estatisticas?.total_arrecadado || 0)}
                                </p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Imóveis Isentos</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e' }}>
                                    {resultadoSimulacao.estatisticas?.total_isentos?.toLocaleString() || 0}
                                </p>
                            </div>
                        </div>

                        {/* Faixas de Valor */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Média TLP</p>
                                <p style={{ fontWeight: 600 }}>{formatCurrency(resultadoSimulacao.estatisticas?.media_tlp || 0)}</p>
                            </div>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mínimo TLP</p>
                                <p style={{ fontWeight: 600 }}>{formatCurrency(resultadoSimulacao.estatisticas?.min_tlp || 0)}</p>
                            </div>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Máximo TLP</p>
                                <p style={{ fontWeight: 600 }}>{formatCurrency(resultadoSimulacao.estatisticas?.max_tlp || 0)}</p>
                            </div>
                        </div>

                        {/* Distribuição por Uso */}
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Distribuição por Tipo de Uso</h3>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {resultadoSimulacao.por_uso?.map((item: any) => (
                                <div key={item.uso} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)'
                                }}>
                                    <span style={{ fontWeight: 500 }}>{item.uso || 'N/A'}</span>
                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{item.quantidade?.toLocaleString()} imóveis</span>
                                        <span style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{formatCurrency(item.total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

