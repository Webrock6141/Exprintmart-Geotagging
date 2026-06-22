"use client"

import { type FormEvent, useEffect, useState } from "react"
import { LogIn, ShieldCheck, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GeoTagTool } from "@/components/geotag-tool"

const STORAGE_KEY = "exprintmart-office-auth"
const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_LOGIN_USERNAME || "exprintmart-office"
const DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_LOGIN_PASSWORD || "Exprintmart@Office"

export function AuthGate() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === "true") {
        setIsAuthed(true)
      }
    } catch {
      // ignore storage access issues
    } finally {
      setChecking(false)
    }
  }, [])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (
      username.trim() === DEFAULT_USERNAME &&
      password === DEFAULT_PASSWORD
    ) {
      window.localStorage.setItem(STORAGE_KEY, "true")
      setIsAuthed(true)
      setError("")
      return
    }

    setError("Only Exprintmart office users can access this tool.")
  }

  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY)
    setIsAuthed(false)
  }

  if (checking) {
    return null
  }

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Restricted Access</p>
              <h2 className="text-xl font-semibold">Exprintmart Office Login</h2>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Exprintmart Office</p>
          <Button variant="ghost" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>
      <GeoTagTool />
    </div>
  )
}
