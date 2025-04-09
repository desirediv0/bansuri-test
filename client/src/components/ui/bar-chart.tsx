"use client"

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
    data: Array<{
        month: string;
        amount: number;
    }>;
}

export function BarChart({ data }: BarChartProps) {
    if (!data || data.length === 0) {
        return <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>;
    }

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Tooltip 
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                        labelStyle={{ color: '#000' }}
                        contentStyle={{ 
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            padding: '8px'
                        }}
                    />
                    <Bar 
                        dataKey="amount" 
                        fill="#ef4444" 
                        radius={[4, 4, 0, 0]}
                    />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
} 