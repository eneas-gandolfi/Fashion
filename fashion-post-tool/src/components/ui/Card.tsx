import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
}

export function Card({ children, className, gradient, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                gradient && "bg-gradient-to-br from-pink-50 to-white border-pink-100",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
