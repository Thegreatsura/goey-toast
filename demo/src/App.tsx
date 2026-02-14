import { GoeyToaster, goeyToast } from 'goey-toast'
import './App.css'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function failAfter(ms: number) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), ms))
}

function App() {
  return (
    <>
      <GoeyToaster position="top-left" />

      <div className="demo">
        <h1>goey-toast</h1>
        <p className="subtitle">Morphing toast notifications</p>

        <div className="section">
          <h2>Simple Toasts</h2>
          <div className="buttons">
            <button onClick={() => goeyToast.success('Changes Saved')}>
              Success
            </button>
            <button onClick={() => goeyToast.error('Something went wrong')}>
              Error
            </button>
            <button onClick={() => goeyToast.warning('Storage is almost full')}>
              Warning
            </button>
            <button onClick={() => goeyToast.info('New update available')}>
              Info
            </button>
          </div>
        </div>

        <div className="section">
          <h2>With Description</h2>
          <div className="buttons">
            <button
              onClick={() =>
                goeyToast.warning('Your session is about to expire', {
                  description:
                    "You've been inactive for 25 minutes. Please save your work or your session will end automatically.",
                })
              }
            >
              Warning + Description
            </button>
            <button
              onClick={() =>
                goeyToast.error('Something went wrong', {
                  description:
                    "You've used 95% of your available storage. Please upgrade and plan to continue.",
                })
              }
            >
              Error + Description
            </button>
          </div>
        </div>

        <div className="section">
          <h2>With Action Button</h2>
          <div className="buttons">
            <button
              onClick={() =>
                goeyToast.error('Something went wrong', {
                  description:
                    "You've used 95% of your available storage. Please upgrade and plan to continue.",
                  action: {
                    label: 'Action Button',
                    onClick: () => goeyToast.success('Action clicked!'),
                  },
                })
              }
            >
              Error + Action
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Promise (Morph Animation)</h2>
          <div className="buttons">
            <button
              onClick={() =>
                goeyToast.promise(sleep(2000), {
                  loading: 'Saving...',
                  success: 'Changes Saved',
                  error: 'Something went wrong',
                })
              }
            >
              Promise → Success (pill)
            </button>
            <button
              onClick={() =>
                goeyToast.promise(failAfter(2000), {
                  loading: 'Saving...',
                  success: 'Changes Saved',
                  error: 'Something went wrong',
                })
              }
            >
              Promise → Error (pill)
            </button>
            <button
              onClick={() =>
                goeyToast.promise(failAfter(2000), {
                  loading: 'Uploading file...',
                  success: 'Upload complete',
                  error: 'Upload failed',
                  description: {
                    error:
                      "You've used 95% of your available storage. Please upgrade and plan to continue.",
                  },
                  action: {
                    error: {
                      label: 'Action Button',
                      onClick: () => goeyToast.info('Retrying...'),
                    },
                  },
                })
              }
            >
              Promise → Error (morph to expanded)
            </button>
            <button
              onClick={() =>
                goeyToast.promise(sleep(2000), {
                  loading: 'Processing...',
                  success: 'All done!',
                  error: 'Failed',
                  description: {
                    success: 'Your data has been processed and saved successfully.',
                  },
                })
              }
            >
              Promise → Success (morph to expanded)
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
