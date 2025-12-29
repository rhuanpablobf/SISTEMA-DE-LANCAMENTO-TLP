'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
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

    const loadList = async () => {
        try {
            const response = await axios.get('http://localhost:8000/simulacoes');
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
            await axios.post('http://localhost:8000/simulacoes', {
                exercicio: Number(exercicio),
                descricao
            });
            setShowForm(false);
            setDescricao('');
            loadList();
        } catch (err) {
            alert('Erro ao criar simulação');
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'RASCUNHO': return 'bg-gray-200 text-gray-700';
            case 'EM_PROCESSAMENTO': return 'bg-blue-100 text-blue-700';
            case 'CONCLUIDO': return 'bg-green-100 text-green-700';
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
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
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
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button type="submit">Criar Cenário</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loading ? <p>Carregando...</p> : list.map((item) => (
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
                            <div>
                                <Button variant="outline" size="sm">Ver Detalhes</Button>
                            </div>
                        </div>
                        {/* Snapshot info mini */}
                        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '2rem' }}>
                            <span>Custo TLP Base: <strong>{Number(item.parametros_snapshot?.custo_tlp_base || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                            <span>Versão Param: <strong>v{item.parametros_snapshot?.versao_parametro || '-'}</strong></span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
