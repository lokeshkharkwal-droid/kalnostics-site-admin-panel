import { PdfTemplateEditor } from '@/features/pdf-templates'

// Editor route — `id === 'new'` creates, any other id edits. Next 14 passes
// `params` synchronously.
export default function Page({ params }: { params: { id: string } }) {
  return <PdfTemplateEditor id={params.id} />
}
