import { getDashboards } from "@/app/actions/dashboard.action"

// Force dynamic rendering so we always read the latest dashboard data
export const dynamic = "force-dynamic"

export default async function TestPdfImagePage() {
  const result = await getDashboards()

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Test PDF Image</h1>
        <p className="text-red-600">Failed to load dashboard: {String(result.result)}</p>
      </div>
    )
  }

  const dashboard: any = result.result || {}
  const containers: any[] = Array.isArray(dashboard.containers) ? dashboard.containers : []
  const pdfContainers = containers.filter((c) => c?.type === "pdf")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Test PDF Image</h1>
        <p className="text-sm text-gray-500">Showing first-page images saved in pdf widgets (containers.pdfimage).</p>
      </div>

      {pdfContainers.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-gray-600">
          No PDF containers found. Please upload a PDF in the edit-dashboard page to populate this view.
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {pdfContainers.map((c, idx) => {
          const pdfimage = c?.pdfimage
          const title = c?.title || c?.pdfFileName || `PDF ${idx + 1}`
          return (
            <div key={`${c.id || idx}`} className="rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white">
              <div className="p-4 border-b border-gray-100">
                <p className="font-semibold text-gray-900 truncate">{title}</p>
                <p className="text-xs text-gray-500 truncate">Container ID: {c?.id || "N/A"}</p>
              </div>
              <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[240px]">
                {pdfimage ? (
                  <img
                    src={pdfimage}
                    alt={title}
                    className="max-h-[220px] max-w-full object-contain rounded-md border border-gray-200 bg-white"
                  />
                ) : (
                  <p className="text-sm text-gray-500 text-center">No pdfimage found on this container.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
