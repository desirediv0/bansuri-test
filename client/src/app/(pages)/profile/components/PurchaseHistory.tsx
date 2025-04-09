"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Purchase {
    id: string;
    date: string;
    amount: number;
    description: string;
    status: 'completed' | 'failed' | 'refunded';
    receiptId: string;
}

const PurchaseHistory = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        // Simulating API fetch
        const fetchPurchases = async () => {
            try {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Mock data
                const mockPurchases = [
                    {
                        id: '1',
                        date: '2023-06-15',
                        amount: 999,
                        description: 'Introduction to Bansuri',
                        status: 'completed' as const,
                        receiptId: 'REC-001234'
                    },
                    {
                        id: '2',
                        date: '2023-05-20',
                        amount: 1499,
                        description: 'Advanced Flute Techniques',
                        status: 'completed' as const,
                        receiptId: 'REC-001122'
                    },
                    {
                        id: '3',
                        date: '2023-04-10',
                        amount: 799,
                        description: 'Beginner Flute Course',
                        status: 'refunded' as const,
                        receiptId: 'REC-000987'
                    }
                ];

                setPurchases(mockPurchases);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching purchases:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load your purchase history',
                    variant: 'destructive',
                });
                setLoading(false);
            }
        };

        fetchPurchases();
    }, [toast]);

    const downloadReceipt = (receiptId: string) => {
        toast({
            title: 'Receipt Download',
            description: `Downloading receipt ${receiptId}...`,
        });
        // In real implementation, this would download a PDF or redirect to receipt page
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: Purchase['status']) => {
        switch (status) {
            case 'completed':
                return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            case 'refunded':
                return <Badge variant="outline">Refunded</Badge>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (purchases.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-10 text-muted-foreground">
                    No purchase history found
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Receipt</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchases.map((purchase) => (
                                <TableRow key={purchase.id}>
                                    <TableCell>{formatDate(purchase.date)}</TableCell>
                                    <TableCell>{purchase.description}</TableCell>
                                    <TableCell className="text-right">₹{purchase.amount}</TableCell>
                                    <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => downloadReceipt(purchase.receiptId)}
                                            disabled={purchase.status !== 'completed'}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Download receipt</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default PurchaseHistory;
