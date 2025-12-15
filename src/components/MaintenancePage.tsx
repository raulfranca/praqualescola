interface MaintenancePageProps {
  title: string;
  message: string;
}

export function MaintenancePage({ title, message }: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-[#f0f7f9] flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center text-center max-w-md">
        {/* App Logo */}
        <img 
          src="/icon-512.png" 
          alt="Pra Qual Escola" 
          className="w-20 h-20 sm:w-32 sm:h-32 mb-8 rounded-2xl shadow-lg"
        />
        
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1ba3c6] mb-5">
          {title}
        </h1>
        
        {/* Message */}
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}
