import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Home from "./pages/Home";
import Decks from "./pages/Decks";
import DeckDetails from "./pages/DeckDetails";
import Study from "./pages/Study";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-background">
                    <div className="flex">
                      <Navigation />
                      <main className="flex-1 p-4 pb-20 md:pb-4 md:ml-64">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/decks" element={<Decks />} />
                          <Route path="/decks/:deckId" element={<DeckDetails />} />
                          <Route path="/study/:deckId?" element={<Study />} />
                          <Route path="/progress" element={<Progress />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
