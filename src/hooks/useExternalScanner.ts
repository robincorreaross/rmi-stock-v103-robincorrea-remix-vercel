
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export function useExternalScanner() {
  const [isExternalMode, setIsExternalMode] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isExternalMode || !isListening) return;
    
    console.log('Tecla capturada:', event.key);
    
    // Previne o comportamento padrão para evitar interferência
    event.preventDefault();
    
    // Enter indica fim da leitura do código
    if (event.key === 'Enter') {
      if (scannedCode.trim()) {
        console.log('Código lido completo:', scannedCode.trim());
        // Dispara evento customizado com o código lido
        const scanEvent = new CustomEvent('externalScanComplete', {
          detail: { barcode: scannedCode.trim() }
        });
        window.dispatchEvent(scanEvent);
        
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
    setScannedCode(prev => {
      const newCode = prev + event.key;
      console.log('Código sendo formado:', newCode);
      return newCode;
    });
  }, [isExternalMode, isListening, scannedCode]);

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
    
    console.log('Leitor externo ativado - aguardando entrada de teclado');
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
