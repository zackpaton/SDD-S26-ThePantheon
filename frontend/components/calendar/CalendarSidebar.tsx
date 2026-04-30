'use client';

/**
 * Filter dropdowns and Add Event for month and week calendar layouts.
 */
import {fraternities} from '@/data/fraternities';
import type {CalendarBoardState} from './useCalendarBoard';

type SidebarProps = { board: CalendarBoardState };

export default function CalendarSidebar({board}: SidebarProps) {
  const {
    userRole,
    allEventTypes,
    eventTypes,
    setEventTypes,
    fraternitiesShown,
    setFraternitiesShown,
    eventDropdownOpen,
    setEventDropdownOpen,
    fraternityDropdownOpen,
    setFraternityDropdownOpen,
    setShowAddModal,
    toggleItem,
    toggleAll,
  } = board;

  const allFraternities = fraternities.map((f) => f.name);

  const filterBtn =
    'flex min-h-[44px] cursor-pointer items-center justify-between ' +
    'rounded border border-black bg-purple-400 px-3 py-3 text-left text-sm ' +
    'text-black transition-colors hover:bg-purple-500 sm:min-h-0 sm:p-2';

  return (
    <div
      className={
        'relative flex w-full shrink-0 flex-col gap-3 self-stretch ' +
        'lg:w-56 lg:gap-4'
      }
    >
      <div className="flex flex-col text-sm font-medium relative">
        <button
          type="button"
          onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
          className={
            `${filterBtn} ${eventDropdownOpen ? 'bg-purple-500' : ''}`
          }
        >
          Event Types
          <span className="ml-2">▼</span>
        </button>

        {eventDropdownOpen && (
          <div
            className={
              'absolute left-0 right-0 top-full z-10 mt-1 max-h-56 ' +
              'overflow-auto rounded border bg-white p-2 shadow'
            }
          >
            <button
              type="button"
              onClick={() =>
                toggleAll(allEventTypes, eventTypes, setEventTypes)
              }
              className="text-sm underline mb-2"
            >
              {eventTypes.length === allEventTypes.length ?
                'Unselect All' :
                'Select All'}
            </button>
            {allEventTypes.map((type) => (
              <label
                key={type}
                className={
                  'flex cursor-pointer items-center gap-2 px-2 py-1 ' +
                  'hover:bg-gray-100'
                }
              >
                <input
                  type="checkbox"
                  checked={eventTypes.includes(type)}
                  onChange={() => toggleItem(type, eventTypes, setEventTypes)}
                />
                {type}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col text-sm font-medium relative">
        <button
          type="button"
          onClick={() => setFraternityDropdownOpen(!fraternityDropdownOpen)}
          className={`${filterBtn} ${
            fraternityDropdownOpen ? 'bg-purple-500' : ''
          }`}
        >
          Fraternities
          <span className="ml-2">▼</span>
        </button>

        {fraternityDropdownOpen && (
          <div
            className={
              'absolute left-0 right-0 top-full z-10 mt-1 max-h-56 ' +
              'overflow-auto rounded border bg-white p-2 shadow'
            }
          >
            <button
              type="button"
              onClick={() =>
                toggleAll(
                  allFraternities,
                  fraternitiesShown,
                  setFraternitiesShown,
                )
              }
              className="text-sm underline mb-2"
            >
              {fraternitiesShown.length === allFraternities.length ?
                'Unselect All' :
                'Select All'}
            </button>
            {fraternities.map((f) => (
              <label
                key={f.name}
                className={
                  'flex cursor-pointer items-center gap-2 px-2 py-1 ' +
                  'hover:bg-gray-100'
                }
              >
                <input
                  type="checkbox"
                  checked={fraternitiesShown.includes(f.name)}
                  onChange={() =>
                    toggleItem(
                      f.name,
                      fraternitiesShown,
                      setFraternitiesShown,
                    )
                  }
                />
                {f.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {userRole === 'Event Coordinator' && (
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className={
            'mt-auto min-h-[44px] rounded border border-black bg-blue-500 ' +
            'px-4 py-3 text-sm font-medium text-white transition-colors ' +
            'hover:bg-purple-700 sm:min-h-0 sm:py-2'
          }
        >
          Add Event
        </button>
      )}
    </div>
  );
}
