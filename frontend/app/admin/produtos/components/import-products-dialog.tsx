"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { productsApi } from "@/lib/api"
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ImportProductsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type ImportResult = {
  reference: string
  success: boolean
  productId?: number
  error?: string
}

export function ImportProductsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportProductsDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{
    total: number
    success: number
    failed: number
    results: ImportResult[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validExtensions = ['.xlsx', '.xls']
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
          variant: "destructive",
        })
        return
      }
      
      setFile(selectedFile)
      setResults(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await productsApi.downloadImportTemplate()
      toast({
        title: "Template baixado",
        description: "O template foi baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao baixar template:', error)
      toast({
        title: "Erro ao baixar template",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao baixar o template.",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Arquivo não selecionado",
        description: "Por favor, selecione um arquivo para importar.",
        variant: "destructive",
      })
      return
    }

    setImporting(true)
    setResults(null)

    try {
      const importResults = await productsApi.importProductsFromXlsx(file)
      setResults(importResults)

      if (importResults.success > 0) {
        toast({
          title: "Importação concluída",
          description: `${importResults.success} produto(s) importado(s) com sucesso.`,
        })
        onSuccess?.()
      }

      if (importResults.failed > 0) {
        toast({
          title: "Alguns produtos falharam",
          description: `${importResults.failed} produto(s) não puderam ser importados.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao importar produtos:', error)
      
      let errorMessage = "Ocorreu um erro ao importar os produtos."
      if (error instanceof Error) {
        errorMessage = error.message
        // Se for erro de autenticação, sugerir fazer login novamente
        if (errorMessage.includes('Não autorizado') || errorMessage.includes('401')) {
          errorMessage = "Sessão expirada. Por favor, faça login novamente."
        }
      }
      
      toast({
        title: "Erro ao importar produtos",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Produtos via Excel</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel (.xlsx) para importar produtos em massa.
            Baixe o template para ver o formato correto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão de download do template */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Template de Importação</p>
                <p className="text-xs text-slate-500">Baixe o modelo para preencher corretamente</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="border-slate-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>

          {/* Upload de arquivo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Selecionar Arquivo</label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {file ? file.name : "Clique para selecionar ou arraste o arquivo aqui"}
                  </span>
                </div>
              </label>
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{file.name}</span>
                <span className="text-slate-400">({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>

          {/* Resultados da importação */}
          {results && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Total processado</p>
                  <p className="text-2xl font-bold text-slate-900">{results.total}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-700">Sucesso</p>
                  <p className="text-2xl font-bold text-emerald-700">{results.success}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700">Falhas</p>
                  <p className="text-2xl font-bold text-red-700">{results.failed}</p>
                </div>
              </div>

              {results.failed > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <p className="font-medium">Produtos com erro:</p>
                      {results.results
                        .filter((r) => !r.success)
                        .map((result, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{result.reference}:</span>{" "}
                            {result.error || "Erro desconhecido"}
                          </div>
                        ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {results.success > 0 && (
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800">
                    {results.success} produto(s) importado(s) com sucesso!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={importing}
          >
            {results ? "Fechar" : "Cancelar"}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar Produtos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

