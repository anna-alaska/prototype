'use client'

import { useRef } from 'react'
import { useProjectStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { DownloadIcon, LayoutGridIcon, CalendarDaysIcon, CalendarIcon, UploadIcon } from 'lucide-react'
import type { ViewScale } from '@/lib/types'

const scaleOptions: { value: ViewScale; label: string; icon: typeof CalendarIcon }[] = [
  { value: 'day', label: 'Day', icon: CalendarIcon },
  { value: 'week', label: 'Week', icon: CalendarDaysIcon },
  { value: 'month', label: 'Month', icon: LayoutGridIcon },
]

export function Header() {
  const { viewScale, setViewScale, exportProjectData, importProjectData } = useProjectStore()
  const importInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const projectData = exportProjectData()
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

    link.href = url
    link.download = `project-export-${timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const raw = await file.text()
      const parsed = JSON.parse(raw)
      const payload =
        parsed && typeof parsed === 'object' && 'businessTasks' in parsed
          ? parsed
          : parsed?.data

      importProjectData(payload)
      window.alert('Project imported successfully.')
    } catch (error) {
      console.error(error)
      window.alert('Failed to import project JSON.')
    } finally {
      event.target.value = ''
    }
  }
  
  return (
    <header className="flex items-center justify-between h-12 sm:h-14 px-2 sm:px-4 border-b border-border bg-card">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportChange}
      />

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-chart-1 flex items-center justify-center">
            <LayoutGridIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
          </div>
          <h1 className="text-sm sm:text-lg font-semibold text-foreground hidden xs:block">Project Manager</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
            onClick={handleImportClick}
          >
            <UploadIcon className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Import JSON</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
            onClick={handleExport}
          >
            <DownloadIcon className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </Button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">View:</span>
          <Select value={viewScale} onValueChange={(value) => setViewScale(value as ViewScale)}>
            <SelectTrigger className="w-20 sm:w-28 h-8 sm:h-9 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scaleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3" onClick={() => window.location.reload()}>
          <span className="hidden sm:inline">Reset Demo</span>
          <span className="sm:hidden">Reset</span>
        </Button>
      </div>
    </header>
  )
}
