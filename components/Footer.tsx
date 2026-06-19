export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">MyStore</h3>
            <p className="text-sm">Качественные товары с быстрой доставкой по всему миру.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Навигация</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Главная</a></li>
              <li><a href="/products" className="hover:text-white transition-colors">Каталог</a></li>
              <li><a href="/cart" className="hover:text-white transition-colors">Корзина</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Поддержка</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@mystore.com" className="hover:text-white transition-colors">support@mystore.com</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          © {new Date().getFullYear()} MyStore. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
