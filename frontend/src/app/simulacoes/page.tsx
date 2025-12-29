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

    // Form State - Campos de Simulação + Parâmetros
    const [exercicio, setExercicio] = useState(new Date().getFullYear() + 1);
    const [descricao, setDescricao] = useState('');
    const [custo, setCusto] = useState<number>(225000000); // Custo base da lei
    const [ipca, setIpca] = useState<number>(0);
    const [subsidio, setSubsidio] = useState<number>(65); // Subsídio padrão
    // Valores Base da Lei (2025)
    const [limiteMinBase, setLimiteMinBase] = useState<number>(258);
    const [limiteMaxBase, setLimiteMaxBase] = useState<number>(1600.08);
    // Valores Atualizados (calculados automaticamente)
    const [limiteMinAtualizado, setLimiteMinAtualizado] = useState<number>(258);
    const [limiteMaxAtualizado, setLimiteMaxAtualizado] = useState<number>(1600.08);

    // EFEITO: Recalcula valores atualizados quando IPCA ou Base mudam
    useEffect(() => {
        const fator = 1 + (ipca / 100);
        setLimiteMinAtualizado(Number((limiteMinBase * fator).toFixed(2)));
        setLimiteMaxAtualizado(Number((limiteMaxBase * fator).toFixed(2)));
    }, [ipca, limiteMinBase, limiteMaxBase]);

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
        try {
            await api.post('/simulacoes', {
                exercicio: Number(exercicio),
                descricao,
                custo_tlp_base: custo,
                ipca_percentual: ipca,
                subsidio_percentual: subsidio,
                limite_min_base: limiteMinBase,
                limite_max_base: limiteMaxBase,
                limite_min_atualizado: limiteMinAtualizado,
                limite_max_atualizado: limiteMaxAtualizado
            });
            setShowForm(false);
            setDescricao('');
            setCusto(225000000);
            setIpca(0);
            setSubsidio(65);
            setLimiteMinBase(258);
            setLimiteMaxBase(1600.08);
            setLimiteMinAtualizado(258);
            setLimiteMaxAtualizado(1600.08);
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
                        <CardHeader><CardTitle>Nova Simulação</CardTitle></CardHeader>
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
                                        placeholder="Ex: Simulação com reajuste de 10%"
                                        value={descricao}
                                        onChange={e => setDescricao(e.target.value)}
                                    />
                                </div>

                                {/* Seção: Parâmetros de Cálculo */}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Parâmetros de Cálculo</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                        <Input
                                            label="Custo TLP Base (R$)"
                                            type="number"
                                            step="0.01"
                                            value={custo}
                                            onChange={e => setCusto(Number(e.target.value))}
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
                                            value={subsidio}
                                            onChange={e => setSubsidio(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* Seção: Limites */}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Limites de Valor (R$)</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Valores Base (Lei 2025)</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <Input
                                                    label="Mínimo Base"
                                                    type="number"
                                                    step="0.01"
                                                    value={limiteMinBase}
                                                    onChange={e => setLimiteMinBase(Number(e.target.value))}
                                                />
                                                <Input
                                                    label="Máximo Base"
                                                    type="number"
                                                    step="0.01"
                                                    value={limiteMaxBase}
                                                    onChange={e => setLimiteMaxBase(Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)', marginBottom: '0.5rem' }}>Valores Atualizados (Calculado = Base × IPCA)</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-200)' }}>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mínimo Atualizado</p>
                                                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-700)' }}>
                                                        {limiteMinAtualizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </p>
                                                </div>
                                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-200)' }}>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Máximo Atualizado</p>
                                                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-700)' }}>
                                                        {limiteMaxAtualizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </p>
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
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{item.descricao}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Exercício {item.exercicio} • Criado em {new Date(item.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {item.status !== 'CONVERTIDO_LOTE' && (
                                    <Button variant="outline" size="sm" onClick={() => handleGerarLote(item.id_simulacao)}>
                                        Gerar Lote
                                    </Button>
                                )}
                                <Button variant="outline" size="sm">Ver Detalhes</Button>
                            </div>
                        </div>
                        {/* Snapshot info */}
                        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <span>Custo Base: <strong>{Number(item.parametros_snapshot?.custo_tlp_base || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                            <span>IPCA: <strong>{item.parametros_snapshot?.ipca_percentual || 0}%</strong></span>
                            <span>Subsídio: <strong>{item.parametros_snapshot?.subsidio_percentual || 0}%</strong></span>
                            <span>Limite Min: <strong>{Number(item.parametros_snapshot?.limite_min_atualizado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                            <span>Limite Max: <strong>{Number(item.parametros_snapshot?.limite_max_atualizado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
