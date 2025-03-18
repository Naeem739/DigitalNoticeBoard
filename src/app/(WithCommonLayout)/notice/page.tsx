'use client'
import { getDashboards } from "@/app/actions/dashboard.action";
import Loading from "@/app/loading";
import { TDashboard2 } from "@/types/types";
import { useEffect, useState } from "react";

import { WidgetContainer } from "./components/edit-dashboard-demo-two";


type TResult = {
    success: boolean
    result : TDashboard2
}
const PublicNoticeBoard = ()=>{
    const [dashboard, setDashboard] = useState<TDashboard2 | null >(null);
    const [loading, setLoading] = useState<boolean>(true);

       useEffect(() => {
          const getData = async () => {
            const publicDashboards = await getDashboards() as TResult ;
            if (publicDashboards.success) {
              console.log(publicDashboards);
              setDashboard(publicDashboards?.result);
            }
            setLoading(false);


          };
      
          getData();
         
        }, []);
        console.log(dashboard);

        if(loading){
            return <Loading></Loading>
        }
    return (
        <div>
          {dashboard && <WidgetContainer data = {dashboard}></WidgetContainer>}
          {/* {dashboard && <Dashboard data = {dashboard}></Dashboard>} */}
          {/* {dashboard && <FluidNoticeLayout></FluidNoticeLayout>  } */}
        </div>
    );
};

export default PublicNoticeBoard;