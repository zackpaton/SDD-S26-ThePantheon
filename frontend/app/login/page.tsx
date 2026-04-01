export default function LoginPage() {
  return (
    <div className="flex items-center justify-center h-screen">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Username"></input>
        </div>
        <div className="mb-6">
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="Password"></input>
        </div>
        <div>
          <button className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 rounded focus:outline-none focus:shadow-outline" type="button">
            Login
          </button>
          <a className="block align-baseline text-right text-purple-500 hover:text-purple-800" href="#">
            Forgot Password?
          </a>
          <br></br>
          <a className="block align-baseline font-bold text-center text-purple-500 hover:text-purple-800" href="#">
            Don't have an account? <br></br>Sign up
          </a>
        </div>
      </form>
    </div>
  )
}