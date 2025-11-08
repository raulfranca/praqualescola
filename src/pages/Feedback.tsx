import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const Feedback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load Tally embed script
    const script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-background">
      {/* Close Button */}
      <Button
        onClick={() => navigate("/")}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Tally Embed */}
      <iframe
        data-tally-src="https://tally.so/r/Y5DJ2z?transparentBackground=1&formEventsForwarding=1"
        width="100%"
        height="100%"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title="Pra Qual Escola Eu Vou?"
        className="absolute inset-0"
      />

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent py-3 text-center z-40">
        <p className="text-xs text-muted-foreground">
          Desenvolvido pelo professor Raul Cabral
        </p>
      </div>
    </div>
  );
};

export default Feedback;
