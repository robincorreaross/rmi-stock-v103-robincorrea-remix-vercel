import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Info, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProductImportProps {
  onImport: (content: string) => Promise<number>;
}

export function ProductImport({ onImport }: ProductImportProps) {
  const [importContent, setImportContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportContent(content);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleImport = async () => {
    if (!importContent.trim()) return;

    setIsImporting(true);
    try {
      await onImport(importContent);
      setImportContent(''); // Limpar após importação bem-sucedida
    } catch (error) {
      console.error('Erro na importação:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const sampleContent = `0000000020625;7894900530001;AGUA CRYSTAL PET 500ML SEM GAS                    ;3,00;0037
0000000020626;7894900531008;AGUA CRYSTAL PET 500ML COM GAS                    ;3,50;0187`;

  const downloadSample = () => {
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exemplo_produtos.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Importar Produtos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações sobre o formato */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Formato esperado:</strong></p>
                <p className="text-sm font-mono bg-muted p-2 rounded">
                  código_interno;código_barras;descrição;preço;estoque
                </p>
                <p className="text-sm">
                  • Apenas o <strong>código de barras</strong> e a <strong>descrição</strong> serão importados<br/>
                  • Use ponto e vírgula (;) como separador<br/>
                  • Um produto por linha
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSample}
                  className="mt-2"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Baixar Exemplo
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Upload de arquivo */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={handleSelectFile}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Selecionar Arquivo TXT
            </Button>
          </div>

          {/* Área de texto para colar conteúdo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              ou cole o conteúdo aqui:
            </label>
            <Textarea
              placeholder="Cole o conteúdo do arquivo aqui..."
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Botão de importação */}
          <Button
            onClick={handleImport}
            disabled={!importContent.trim() || isImporting}
            className="w-full"
          >
            {isImporting ? 'Importando...' : 'Importar Produtos'}
          </Button>

          {/* Preview das linhas que serão processadas */}
          {importContent.trim() && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview:</label>
              <div className="bg-muted p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                {importContent.split('\n').slice(0, 5).map((line, index) => {
                  const parts = line.split(';');
                  if (parts.length >= 3) {
                    return (
                      <div key={index} className="text-green-600">
                        ✓ {parts[1]?.trim()} - {parts[2]?.trim()}
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="text-red-600">
                      ✗ Linha inválida: {line}
                    </div>
                  );
                })}
                {importContent.split('\n').length > 5 && (
                  <div className="text-muted-foreground">
                    ... e mais {importContent.split('\n').length - 5} linhas
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}