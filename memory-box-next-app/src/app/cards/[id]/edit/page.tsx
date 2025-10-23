// Required for static export - provides a placeholder path
export function generateStaticParams() {
  return [{ id: '_' }];
}

interface EditCardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCardPage({ params }: EditCardPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Card</h1>
      <p className="text-gray-600 mb-4">
        Editing card ID: {id}
      </p>
      {/* Card edit form will be implemented later */}
    </div>
  );
}
