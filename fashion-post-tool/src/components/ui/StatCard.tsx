import { Card } from "./Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    color?: "pink" | "blue" | "green" | "orange" | "default";
    loading?: boolean;
    className?: string;
}

export function StatCard({
    label,
    value,
    icon,
    trend,
    trendUp,
    color = "default",
    loading,
    className
}: StatCardProps) {

    const colors = {
        default: "bg-white border-gray-100",
        pink: "bg-white border-pink-100 dark:border-pink-900/20",
        blue: "bg-white border-blue-100 dark:border-blue-900/20",
        green: "bg-white border-emerald-100 dark:border-emerald-900/20",
        orange: "bg-white border-orange-100 dark:border-orange-900/20",
    };

    const iconColors = {
        default: "bg-gray-50 text-gray-600",
        pink: "bg-pink-50 text-pink-600",
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        orange: "bg-orange-50 text-orange-600",
    };

    if (loading) {
        return (
            <Card className={cn("animate-pulse h-32", className)}>
                <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </Card>
        );
    }

    return (
        <Card className={cn("relative overflow-hidden border transition-all hover:shadow-md", colors[color], className)}>
            <div className="flex justify-between items-start">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                        {label}
                    </p>
                    <h3 className="text-3xl font-bold tracking-tight text-gray-900">{value}</h3>

                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 mt-2 text-xs font-medium",
                            trendUp ? "text-emerald-600" : "text-gray-500"
                        )}>
                            <span>{trendUp ? "↑" : "•"}</span>
                            <span>{trend}</span>
                        </div>
                    )}
                </div>

                <div className={cn("p-3 rounded-xl flex-shrink-0", iconColors[color])}>
                    {icon}
                </div>
            </div>
        </Card>
    );
}
