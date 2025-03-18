"use client"

import { TDashboard2 } from "@/types/types"

// type Widget = {
//   id: string
//   x: number
//   y: number
//   w: number
//   h: number
//   leftPx: string
//   topPx: string
//   leftPercent: string
//   topPercent: string
//   width: string
//   height: string
//   title: string
//   color: string
// }

interface WidgetContainerProps {
  data : TDashboard2
}

export function WidgetContainer({ data }: WidgetContainerProps) {
  console.log(data);
  return (
    <div className="w-full border border-green-600 ">

      <h1 className="text-center text-4xl my-5"> Notices</h1>
    <div
      className={` relative mx-auto border bg-gray-100 p-5 md:w-[85%] sm:w-[95%] `}
      style={{
        // Set a minimum height based on the widgets' positions
        minHeight: "80vh",
        // Or calculate dynamically based on the furthest widget:
        // minHeight: `${Math.max(...widgets.map(w => parseFloat(w.topPercent) + parseFloat(w.height)))}%`
      }}
    > <div className=" bg-gray-100 w-[100%] mx-auto h-[80vh] relative">
      {data.containers.map((widget) => {
        const height = widget.height.split(".")[0]; 
        const top = widget.topPercent.split(".")[0]; 
        const totalHeight = parseFloat(height) + parseFloat(top);
        console.log(totalHeight);
        console.log(totalHeight);

        return(
        <div
          key={widget.id}
          className={`absolute  rounded-lg shadow-sm p-4 bg-white`}
          style={{
            left: widget.leftPercent,
            top: widget.topPercent,
            width: widget.width,
            height: totalHeight >= 100 ? `${98-parseFloat(top)}%` : widget.height,
            border: "1px solid rgba(0,0,0,0.1)",
            transition: "all 0.2s ease-in-out",
          }}
        >
          
          <div className="font-medium">
            <h3 className="text-center font-bold text-3xl ">{widget?.category }</h3>
            {widget?.noticeIds.map(id => {
              return <div className="font-semibold text-xl text-center overflow-x-auto" key={id}>
                {   
                    data.notices.find(notice => notice.id === id)?.title

                 }
                </div>
            }) }
             </div>

        </div>
      )  })}
       </div>
    </div>
    </div>
  )
}


/*
"use client"

import { TDashboard2 } from "@/types/types"

// type Widget = {
//   id: string
//   x: number
//   y: number
//   w: number
//   h: number
//   leftPx: string
//   topPx: string
//   leftPercent: string
//   topPercent: string
//   width: string
//   height: string
//   title: string
//   color: string
// }

interface WidgetContainerProps {
  data : TDashboard2
}

export function WidgetContainer({ data }: WidgetContainerProps) {
  return (
    <div className="w-full border border-green-600 ">

      <h1 className="text-center text-4xl my-5"> Notices</h1>
    <div
      className={` relative mx-auto border bg-gray-100 p-5 md:w-[85%] sm:w-[95%] `}
      style={{
        // Set a minimum height based on the widgets' positions
        minHeight: "80vh",
        // Or calculate dynamically based on the furthest widget:
        // minHeight: `${Math.max(...widgets.map(w => parseFloat(w.topPercent) + parseFloat(w.height)))}%`
      }}
    > <div className=" bg-gray-100 w-[100%] mx-auto h-[80vh] relative">
      {data.containers.map((widget) => (
        <div
          key={widget.id}
          className={`absolute  rounded-lg shadow-sm p-4 bg-white`}
          style={{
            left: widget.leftPercent,
            top: widget.topPercent,
            width: widget.width,
            height: widget.height,
            border: "1px solid rgba(0,0,0,0.1)",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <div className="font-medium">{widget.noticeIds } 

             
             
             <h3>Naeem</h3> </div>
          <div className="text-xs text-gray-500 mt-2">
            Position: {widget.leftPercent}, {widget.topPercent}
          </div>
          <div className="text-xs text-gray-500">
            Size: {widget.width} × {widget.height}
          </div>
        </div>
      ))}
       </div>
    </div>
    </div>
  )
}
*/
