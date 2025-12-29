'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Parametro {
    id_parametro: string;
    exercicio: number;
    versao: number;
    custo_tlp_base: number;
    created_at: string;
}

export default function ParametrosPage() {
    const [params, setParams] = useState<Parametro[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [exercicio, setExercicio] = useState(new Date().getFullYear() + 1);
    const [custo, setCusto] = useState('');
    const [ipca, setIpca] = useState('');
    const [subsidio, setSubsidio] = useState('');
    const [limiteMin, setLimiteMin] = useState('');
    const [limiteMax, setLimiteMax] = useState('');
    const [limiteMinAtualizado, setLimiteMinAtualizado] = useState('');
    const [limiteMaxAtualizado, setLimiteMaxAtualizado] = useState('');

    const loadParams = async () => {
        try {
            const response = await axios.get('http://localhost:8000/parametros');
            setParams(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadParams();
    }, []);

    const updateIpca = (val: string) => {
        setIpca(val);
        const factor = 1 + (Number(val) / 100);
        if (limiteMin) setLimiteMinAtualizado((Number(limiteMin) * factor).toFixed(2));
        if (limiteMax) setLimiteMaxAtualizado((Number(limiteMax) * factor).toFixed(2));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/parametros', {
                exercicio: Number(exercicio),
                custo_tlp_base: Number(custo),
                ipca_percentual: Number(ipca),
                subsidio_percentual: Number(subsidio),
                limite_min_base: Number(limiteMin),
                limite_max_base: Number(limiteMax),
                limite_min_atualizado: Number(limiteMinAtualizado),
                limite_max_atualizado: Number(limiteMaxAtualizado)
            });
            setShowForm(false);
            loadParams();
        } catch (err) {
            alert('Erro ao salvar parâmetros');
        }
    };

    return (
        <div className="container-premium">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Parâmetros de Cálculo</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Gerencie as constantes e índices utilizados no cálculo da TLP.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : 'Novo Parâmetro'}
                </Button>
            </header>

            {showForm && (
                <div style={{ marginBottom: '2rem' }} className="fade-in">
                    <Card>
                        <CardHeader><CardTitle>Novo Parâmetro - Exercício {exercicio}</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                                <Input
                                    label="Exercício"
                                    type="number"
                                    value={exercicio}
                                    onChange={e => setExercicio(Number(e.target.value))}
                                />
                                <Input
                                    label="Custo Base TLP (R$)"
                                    type="number"
                                    step="0.01"
                                    value={custo}
                                    onChange={e => setCusto(e.target.value)}
                                    placeholder="0.00"
                                />
                                <Input
                                    label="IPCA (%)"
                                    type="number"
                                    step="0.01"
                                    value={ipca}
                                    onChange={e => updateIpca(e.target.value)}
                                    placeholder="0.00"
                                />
                                <Input
                                    label="Subsídio (%)"
                                    type="number"
                                    step="0.01"
                                    value={subsidio}
                                    onChange={e => setSubsidio(e.target.value)}
                                    placeholder="0.00"
                                />
                                <div style={{ gridColumn: 'span 2', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Definição de Limites (R$)</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Valores Base (Lei Original)</span>
                                            <Input
                                                label="Mínimo Base"
                                                type="number"
                                                step="0.01"
                                                value={limiteMin}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setLimiteMin(val);
                                                    if (ipca) {
                                                        const factor = 1 + (Number(ipca) / 100);
                                                        setLimiteMinAtualizado((Number(val) * factor).toFixed(2));
                                                    } else {
                                                        setLimiteMinAtualizado(val);
                                                    }
                                                }}
                                                placeholder="0.00"
                                            />
                                            <Input
                                                label="Máximo Base"
                                                type="number"
                                                step="0.01"
                                                value={limiteMax}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setLimiteMax(val);
                                                    if (ipca) {
                                                        const factor = 1 + (Number(ipca) / 100);
                                                        setLimiteMaxAtualizado((Number(val) * factor).toFixed(2));
                                                    } else {
                                                        setLimiteMaxAtualizado(val);
                                                    }
                                                }}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)' }}>Valores Atualizados (Aplicação)</span>
                                            <Input
                                                label="Mínimo Atualizado"
                                                type="number"
                                                step="0.01"
                                                value={limiteMinAtualizado}
                                                onChange={e => setLimiteMinAtualizado(e.target.value)}
                                                placeholder="Calculado..."
                                                style={{ borderColor: 'var(--primary-200)', backgroundColor: 'var(--primary-50)' }}
                                            />
                                            <Input
                                                label="Máximo Atualizado"
                                                type="number"
                                                step="0.01"
                                                value={limiteMaxAtualizado}
                                                onChange={e => setLimiteMaxAtualizado(e.target.value)}
                                                placeholder="Calculado..."
                                                style={{ borderColor: 'var(--primary-200)', backgroundColor: 'var(--primary-50)' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <Button type="submit">Salvar Versão</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loading ? <p>Carregando...</p> : params.map((param: any) => (
                    <Card key={param.id_parametro}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Exercício {param.exercicio} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>v{param.versao}</span></h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Criado em {new Date(param.created_at).toLocaleDateString()}</p>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Custo Base</p>
                                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-600)' }}>
                                    {Number(param.custo_tlp_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>IPCA / Subsídio</p>
                                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                    {Number(param.ipca_percentual || 0).toFixed(2)}% / {Number(param.subsidio_percentual || 0).toFixed(2)}%
                                </p>
                            </div>
                        </div>
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <span><strong>Min Base:</strong> {Number(param.limite_min_base || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <span><strong>Max Base:</strong> {Number(param.limite_max_base || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <span style={{ color: 'var(--primary-600)' }}><strong>Min Atualizado:</strong> {Number(param.limite_min_atualizado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <span style={{ color: 'var(--primary-600)' }}><strong>Max Atualizado:</strong> {Number(param.limite_max_atualizado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </Card>
                ))}
                {params.length === 0 && !loading && (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Nenhum parâmetro cadastrado.</p>
                )}
            </div>
        </div >
    );
}
