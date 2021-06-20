import React, { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';
import FilesGrid from '../components/FilesGrid';
import { useAtomValue } from 'jotai/utils';
import { firebaseUserAtom } from '../atoms/firebaseAtoms';
import firebase from 'firebase/app';
import { File } from '../components/FilesGrid';
import { Box, Flex } from '@chakra-ui/react';

export default function DashboardPage(
  _props: RouteComponentProps
): JSX.Element {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const [files, setFiles] = useState<File[] | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const ref = firebase.database().ref('users').child(firebaseUser.uid);
    const unsubscribe = ref
      .orderByChild('lastAccessTime')
      .limitToLast(50)
      .on('value', snap => {
        if (!snap.exists) {
          setFiles(null);
        } else {
          const newFiles: File[] = [];
          snap.forEach(child => {
            newFiles.push({
              id: child.key,
              ...child.val(),
            });
          });
          newFiles.reverse();
          setFiles(newFiles);
        }
      });
    return () => ref.off('value', unsubscribe);
  }, [firebaseUser]);

  return (
    <Flex p={[4, 6, 8, 12]} minH="full" direction="column">
      <Box flex="1">
        <h1 className="text-gray-100 text-2xl md:text-4xl font-black">
          Real-Time Collaborative Online IDE
        </h1>

        <div className="h-6"></div>

        <Link
          to="/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:ring-indigo-500"
        >
          Create New File
        </Link>

        {files && files.length > 0 && (
          <>
            <div className="h-12"></div>

            <h2 className="text-gray-100 text-xl md:text-3xl font-black">
              Recently Accessed
            </h2>
            <FilesGrid files={files} />
          </>
        )}
      </Box>
      <Box mt="6" color="gray.400">
        Looking to get better at USACO? Check out the{' '}
        <a
          href="https://usaco.guide/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-white"
        >
          USACO Guide
        </a>
        !
      </Box>
    </Flex>
  );
}
