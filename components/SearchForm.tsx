"use client"

interface Props {
  defaultValue?: string
}

export default function SearchForm({ defaultValue }: Props) {
  return (
    <form className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={defaultValue}
          placeholder="Search products..."
          suppressHydrationWarning
          className="flex-1 border border-text/15 bg-card rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          className="bg-primary text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  )
}
