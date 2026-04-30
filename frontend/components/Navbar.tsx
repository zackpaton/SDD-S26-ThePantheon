'use client';

/**
 * Top navigation: scrollable links on narrow viewports, safe-area aware;
 * Calendar, Events, Chat, Profile/Login.
 */
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useState} from 'react';
import {onAuthStateChanged, User} from 'firebase/auth';
import {auth} from '@/lib/firebase';

const baseNavItems = [
  {name: 'Calendar', path: '/calendar'},
  {name: 'Events', path: '/events'},
  {name: 'Chat', path: '/chat'},
];

export default function Navbar() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return null;

  const navItems = [
    ...baseNavItems,
    user ?
      {name: 'Profile', path: '/profile'} :
      {name: 'Login', path: '/login'},
  ];

  return (
    <nav
      className={
        'w-full shrink-0 border-b border-black/10 bg-purple-500 ' +
        'pt-[env(safe-area-inset-top)]'
      }
    >
      <div
        className={
          'mx-auto flex min-h-12 max-w-7xl items-center gap-2 px-3 ' +
          'sm:min-h-14 sm:px-6'
        }
      >
        <Link
          href="/calendar"
          className={
            'shrink-0 text-lg font-semibold tracking-tight text-black ' +
            'sm:text-xl'
          }
        >
          Greeked Out
        </Link>

        <div
          className={
            'min-w-0 flex-1 overflow-x-auto overscroll-x-contain ' +
            '[-ms-overflow-style:none] [scrollbar-width:none] ' +
            '[&::-webkit-scrollbar]:hidden'
          }
        >
          <div
            className={
              'flex items-center justify-end gap-2 py-1 pl-2 ' +
              'sm:justify-end sm:gap-5 sm:py-0 sm:pl-0'
            }
          >
            {navItems.map((item) => {
              let isActive = pathname === item.path;

              if (
                item.name === 'Login' &&
                (pathname === '/login' || pathname === '/sign-up')
              ) {
                isActive = true;
              }

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={
                    'shrink-0 whitespace-nowrap rounded-md px-2 py-2 ' +
                    'text-xs font-medium transition-colors sm:px-0 sm:py-2 ' +
                    'sm:text-sm ' +
                    (isActive ?
                      'text-white' :
                      'text-black hover:text-blue-600')
                  }
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
