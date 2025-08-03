import Navbar from "../Navbar/Navbar"

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-base-100">
            <Navbar></Navbar>
            <main className="max-w-7xl mx-auto px-3 lg:px-4 py-4 lg:py-6">
                { children }
            </main>
        </div>
    )
}

export default Layout