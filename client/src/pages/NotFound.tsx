import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-lg mx-4 text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>

        <h1 className="text-4xl font-bold mb-2">404</h1>

        <h2 className="text-xl font-semibold text-muted-foreground mb-4">
          Page Not Found
        </h2>

        <p className="text-muted-foreground mb-8">
          Sorry, the page you are looking for doesn't exist.
        </p>

        <Button onClick={handleGoHome}>
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
