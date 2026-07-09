export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
        
        {/* Spinning gradient ring */}
        <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-primary border-r-purple-500 animate-spin" />
        
        {/* Inner static core */}
        <div className="absolute w-8 h-8 bg-neutral-900 rounded-full shadow-inner" />
      </div>
      
      <p className="mt-6 text-sm font-medium text-neutral-400 tracking-wider animate-pulse uppercase">
        Loading...
      </p>
    </div>
  );
}
