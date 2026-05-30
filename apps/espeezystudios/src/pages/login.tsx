            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            style={{ width: '100%', minHeight: 44, padding: '8px 10px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', minHeight: 44 }}>
          Sign In
        </button>
        {error && (
          <div id="login-error" role="alert" style={{ color: '#b00020', marginTop: 8 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
