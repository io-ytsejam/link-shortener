import React, {ChangeEvent, useEffect, useState} from 'react';
import './App.css';
import TextField from '@mui/material/TextField/TextField';
import Button from '@mui/material/Button/Button';
import {Tooltip} from "@mui/material";

function App() {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [shortLink, setShortLink] = useState('')
  const [isLinkCopiedToClipboard, setLinkCopiedToClipboard] = useState(false)

  useEffect(devRedirect, [])

  return (
    <div style={{
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column'
    }}>
      <h1>Link shortener</h1>
        {!shortLink ?
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <TextField
              onChange={handleChange}
              value={inputValue}
              error={!!error}
              id="outlined-error-helper-text"
              label="URL"
              helperText={error}
            />
            <Button
              disabled={!!error}
              type='submit'
              fullWidth
            >
              Short!
            </Button>
          </form> : <>
            <Tooltip
              open={isLinkCopiedToClipboard}
              onClose={() => setLinkCopiedToClipboard(false)}
              title='Copied to clipboard!'
            >
              <TextField
                value={shortLink}
                label="Short link"
                onClick={handleLinkClick}
                helperText="There is your shorten link (click to copy)"
              />
            </Tooltip>
            <Button
              type='button'
              onClick={goBack}
              fullWidth>go back
            </Button>
          </>}
    </div>
  );

  function handleLinkClick() {
    navigator.clipboard.writeText(shortLink)
      .then(() => setLinkCopiedToClipboard(true))
  }

  function goBack() {
    setShortLink('')
    setError('')
    setInputValue('')
  }

  function handleChange({ target }: ChangeEvent<HTMLInputElement>) {
    const { value } = target
    setInputValue(value)
    if (error) setError('')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (isInvalidUrl(inputValue))
      return setError('Please, provide correct URL')

    const url = encodeURIComponent(inputValue)

    fetch(`/api/?link=${url}`, { method: 'post' })
      .then(async res => {
        if (!res.ok) throw new Error(await res.text())
        return res.text()
      })
      .then(handleResponse)
      .catch(() => setError('Service not available right now'))

    function handleResponse(id: string) {
      setShortLink(`${window.location.origin}/${id}`)
    }
  }

  function isInvalidUrl(url: string) {
    try {
      new URL(url)
      return false
    } catch (e) {
      return true
    }
  }

  function devRedirect () {
    // In development make manual request to backend.
    // In production backend origin will be used as reversed proxy.
    const { NODE_ENV, REACT_APP_BACKEND } = process.env
    const { pathname } = window.location
    if (NODE_ENV === 'development' && pathname.length === 6)
      window.location.replace(`${REACT_APP_BACKEND}${pathname}`)
  }
}

export default App;
