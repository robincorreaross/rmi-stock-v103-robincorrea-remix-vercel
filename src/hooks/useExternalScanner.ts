
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export function useExternalScanner() {
  const [isExternalMode, setIsExternalMode] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isExternalMode || !isListening) return;
    
    // Previne o comportamento padrão para evitar interferência
    event.preventDefault();
    
    // Enter indica fim da leitura do código
    if (event.key === 'Enter') {
      if (scannedCode.trim()) {
        // Dispara evento customizado com o código lido
        const scanEvent = new CustomEvent('externalScanComplete', {
          detail: { barcode: scannedCode.trim() }
        });
        window.dispatchEvent(scanEvent);
        
        toast({
          title: "Código lido!",
          description: `Código: ${scannedCode.trim()}`,
          variant: "default"
        });
        
        setScannedCode('');
      }
      return;
    }
    
    // Ignora teclas especiais
    if (event.key.length > 1 && event.key !== 'Backspace') return;
    
    // Backspace para corrigir
    if (event.key === 'Backspace') {
      setScannedCode(prev => prev.slice(0, -1));
      return;
    }
    
    // Adiciona caractere ao código
    setScannedCode(prev => prev + event.key);
  }, [isExternalMode, isListening, scannedCode, toast]);

  useEffect(() => {
    if (isExternalMode && isListening) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, isExternalMode, isListening]);

  const startExternalScan = () => {
    if (!isExternalMode) return;
    
    setIsListening(true);
    setScannedCode('');
    
    toast({
      title: "Leitor externo ativo",
      description: "Aponte o leitor para o código de barras",
      variant: "default"
    });
  };

  const stopExternalScan = () => {
    setIsListening(false);
    setScannedCode('');
  };

  return {
    isExternalMode,
    setIsExternalMode,
    isListening,
    startExternalScan,
    stopExternalScan,
    scannedCode
  };
}
