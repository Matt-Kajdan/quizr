import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "@shared/auth/AuthProvider";
import { ThemeProvider } from "@shared/state/ThemeProvider";
import { UserProvider } from "@shared/state/UserProvider";

import "./App.css";
import { Home } from "@features/quizzes/pages/Home";
import { Login } from "@features/auth/pages/Login";
import { Signup } from "@features/auth/pages/Signup";
import TakeQuizPage from "@features/quizzes/pages/TakeQuizPage";
import CreateQuiz from "@features/quizzes/pages/CreateQuiz";
import EditQuiz from "@features/quizzes/pages/EditQuiz";
import Layout from "./Layout";
import ProfilePage from "@features/users/pages/ProfilePage";
import FriendsPage from "@features/friends/pages/FriendsPage";
import SettingsPage from "@features/users/pages/SettingsPage";
import LeaderboardPage from "@features/leaderboard/pages/LeaderboardPage";


// docs: https://reactrouter.com/en/main/start/overview
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {index: true, element: <Home /> },
      {path: "login", element: <Login /> },
      {path: "signup", element: <Signup /> },
      {path: "quiz/:id", element: <TakeQuizPage /> },
      {path: "quiz/:id/edit", element: <EditQuiz /> },
      {path: "quizzes/create", element: <CreateQuiz /> },
      {path: "users/:username", element: <ProfilePage /> },
      {path: "friends", element: <FriendsPage /> },
      {path: "leaderboard", element: <LeaderboardPage /> },
      {path: "settings", element: <SettingsPage />}
    ],
  },
]);


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App;
