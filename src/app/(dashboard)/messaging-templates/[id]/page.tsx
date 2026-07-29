import { MessagingTemplateEditor } from '@/features/messaging-templates'

// Editor route — `id === 'new'` creates, any other id edits. Next 14 passes
// `params` synchronously.
export default function Page({ params }: { params: { id: string } }) {
  return <MessagingTemplateEditor id={params.id} />
}
